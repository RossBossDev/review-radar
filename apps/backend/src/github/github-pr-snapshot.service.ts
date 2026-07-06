import { Inject, Injectable } from "@nestjs/common";
import { type Kysely, sql } from "kysely";
import { KYSELY_DB } from "../database/database.tokens";
import type { Database } from "../database/database.types";
import type {
	GithubInstallationRef,
	GithubPullRequestRef,
	GithubRepositoryRef,
	GithubUserRef,
	GithubWebhookPayload,
} from "./github.types";

export interface GithubSnapshotResult {
	installationId?: string;
	repositoryId?: string;
	pullRequestId?: string;
}

@Injectable()
export class GithubPrSnapshotService {
	constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

	async upsertFromPayload(
		payload: GithubWebhookPayload,
	): Promise<GithubSnapshotResult> {
		const installationId = await this.upsertInstallation(payload.installation);
		const repositoryId = await this.upsertRepository(
			payload.repository,
			installationId,
		);
		const pullRequest = payload.pull_request;
		const issuePrNumber = payload.issue?.pull_request
			? payload.issue.number
			: undefined;

		if (!repositoryId || !pullRequest) {
			return { installationId, repositoryId };
		}

		const authorId = await this.upsertUser(pullRequest.user ?? undefined);
		const prId = await this.upsertPullRequest({
			repositoryId,
			pullRequest,
			authorId,
			fallbackNumber: issuePrNumber,
		});

		await this.upsertReviewers(prId, pullRequest.requested_reviewers ?? []);

		return { installationId, repositoryId, pullRequestId: prId };
	}

	private async upsertInstallation(
		installation: GithubInstallationRef | undefined,
	): Promise<string | undefined> {
		if (!installation) {
			return undefined;
		}

		const row = await this.db
			.insertInto("github_installations")
			.values({
				github_installation_id: installation.id.toString(),
				account_login: installation.account?.login ?? null,
				account_type: installation.account?.type ?? null,
			})
			.onConflict((oc) =>
				oc.column("github_installation_id").doUpdateSet({
					account_login: installation.account?.login ?? null,
					account_type: installation.account?.type ?? null,
					updated_at: sql`now()`,
				}),
			)
			.returning("id")
			.executeTakeFirstOrThrow();

		return row.id;
	}

	private async upsertRepository(
		repository: GithubRepositoryRef | undefined,
		installationId: string | undefined,
	): Promise<string | undefined> {
		if (!repository || !installationId) {
			return undefined;
		}

		const [owner, name] = repository.full_name.split("/", 2);
		const row = await this.db
			.insertInto("github_repositories")
			.values({
				github_repository_id: repository.id.toString(),
				installation_id: installationId,
				owner: repository.owner?.login ?? owner,
				name: repository.name ?? name,
				full_name: repository.full_name,
				default_branch: repository.default_branch ?? null,
			})
			.onConflict((oc) =>
				oc.column("github_repository_id").doUpdateSet({
					installation_id: installationId,
					owner: repository.owner?.login ?? owner,
					name: repository.name ?? name,
					full_name: repository.full_name,
					default_branch: repository.default_branch ?? null,
					updated_at: sql`now()`,
				}),
			)
			.returning("id")
			.executeTakeFirstOrThrow();

		return row.id;
	}

	private async upsertUser(
		user: GithubUserRef | undefined,
	): Promise<string | undefined> {
		if (!user) {
			return undefined;
		}

		const row = await this.db
			.insertInto("github_users")
			.values({
				github_user_id: user.id.toString(),
				login: user.login,
				name: user.name ?? null,
			})
			.onConflict((oc) =>
				oc.column("github_user_id").doUpdateSet({
					login: user.login,
					name: user.name ?? null,
					updated_at: sql`now()`,
				}),
			)
			.returning("id")
			.executeTakeFirstOrThrow();

		return row.id;
	}

	private async upsertPullRequest(params: {
		repositoryId: string;
		pullRequest: GithubPullRequestRef;
		authorId: string | undefined;
		fallbackNumber: number | undefined;
	}): Promise<string> {
		const pullRequestNumber =
			params.pullRequest.number ?? params.fallbackNumber;
		if (!pullRequestNumber) {
			throw new Error("Cannot upsert pull request snapshot without a number");
		}

		const row = await this.db
			.insertInto("pull_requests")
			.values({
				repository_id: params.repositoryId,
				github_pull_request_id: params.pullRequest.id.toString(),
				number: pullRequestNumber,
				title: params.pullRequest.title,
				author_github_user_id: params.authorId,
				state: this.snapshotState(params.pullRequest),
				draft: params.pullRequest.draft ?? false,
				html_url: params.pullRequest.html_url,
				merged_at: params.pullRequest.merged_at ?? null,
				closed_at: params.pullRequest.closed_at ?? null,
			})
			.onConflict((oc) =>
				oc.constraint("pull_requests_repository_github_id_unique").doUpdateSet({
					number: pullRequestNumber,
					title: params.pullRequest.title,
					author_github_user_id: params.authorId,
					state: this.snapshotState(params.pullRequest),
					draft: params.pullRequest.draft ?? false,
					html_url: params.pullRequest.html_url,
					merged_at: params.pullRequest.merged_at ?? null,
					closed_at: params.pullRequest.closed_at ?? null,
					updated_at: sql`now()`,
				}),
			)
			.returning("id")
			.executeTakeFirstOrThrow();

		return row.id;
	}

	private async upsertReviewers(
		pullRequestId: string,
		reviewers: GithubUserRef[],
	): Promise<void> {
		for (const reviewer of reviewers) {
			const userId = await this.upsertUser(reviewer);
			if (!userId) {
				continue;
			}
			await this.db
				.insertInto("pull_request_participants")
				.values({
					pull_request_id: pullRequestId,
					github_user_id: userId,
					role: "requested_reviewer",
				})
				.onConflict((oc) =>
					oc
						.constraint("pull_request_participants_pr_user_role_unique")
						.doUpdateSet({ updated_at: sql`now()` }),
				)
				.execute();
		}
	}

	private snapshotState(pullRequest: GithubPullRequestRef): string {
		if (pullRequest.state === "closed" && pullRequest.merged === true) {
			return "merged";
		}
		return pullRequest.state;
	}
}
