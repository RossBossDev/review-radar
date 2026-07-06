import { Injectable } from "@nestjs/common";
import type {
	GithubNormalizedFact,
	GithubWebhookEventName,
	GithubWebhookPayload,
} from "./github.types";

const MENTION_PATTERN =
	/(^|[^\w-])@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)/g;

@Injectable()
export class GithubNormalizer {
	normalize(params: {
		deliveryId: string;
		eventName: GithubWebhookEventName;
		payload: GithubWebhookPayload;
		receivedAt?: Date;
	}): GithubNormalizedFact[] {
		const occurredAt = params.receivedAt ?? new Date();
		const base = this.baseFact(params, occurredAt);
		const facts: GithubNormalizedFact[] = [];

		switch (params.eventName) {
			case "pull_request":
				facts.push(...this.normalizePullRequest(base, params.payload));
				break;
			case "pull_request_review":
				facts.push(...this.normalizeReview(base, params.payload));
				break;
			case "pull_request_review_comment":
				facts.push(...this.normalizePrComment(base, params.payload));
				break;
			case "issue_comment":
				facts.push(...this.normalizeIssueComment(base, params.payload));
				break;
			case "check_suite":
			case "check_run":
				facts.push(...this.normalizeCheck(base, params.payload));
				break;
		}

		return facts;
	}

	private baseFact(
		params: {
			deliveryId: string;
			eventName: GithubWebhookEventName;
			payload: GithubWebhookPayload;
		},
		occurredAt: Date,
	): Omit<GithubNormalizedFact, "type"> {
		const pullRequest = params.payload.pull_request;
		return {
			deliveryId: params.deliveryId,
			eventName: params.eventName,
			action: params.payload.action,
			repositoryFullName: params.payload.repository?.full_name,
			pullRequestNumber: pullRequest?.number ?? params.payload.issue?.number,
			githubPullRequestId: pullRequest?.id?.toString(),
			actorLogin:
				params.payload.comment?.user?.login ??
				params.payload.review?.user?.login ??
				pullRequest?.user?.login,
			occurredAt,
		};
	}

	private normalizePullRequest(
		base: Omit<GithubNormalizedFact, "type">,
		payload: GithubWebhookPayload,
	): GithubNormalizedFact[] {
		const facts: GithubNormalizedFact[] = [];
		if (payload.action === "review_requested") {
			facts.push({
				...base,
				type: "review_requested",
				actorLogin: payload.requested_reviewer?.login ?? base.actorLogin,
			});
		}
		if (payload.action === "closed" && payload.pull_request?.merged === true) {
			facts.push({ ...base, type: "pr_merged" });
		} else if (payload.action === "closed") {
			facts.push({ ...base, type: "pr_closed" });
		} else if (payload.action === "reopened") {
			facts.push({ ...base, type: "pr_reopened" });
		} else if (payload.action === "synchronize") {
			facts.push({ ...base, type: "pr_synchronized" });
		}
		facts.push(...this.mentionFacts(base, payload.pull_request?.body));
		return facts;
	}

	private normalizeReview(
		base: Omit<GithubNormalizedFact, "type">,
		payload: GithubWebhookPayload,
	): GithubNormalizedFact[] {
		const reviewState = payload.review?.state?.toLowerCase();
		const facts: GithubNormalizedFact[] = [];
		if (payload.action === "dismissed") {
			facts.push({ ...base, type: "review_dismissed" });
		} else if (payload.action === "submitted") {
			facts.push({
				...base,
				type: "review_submitted",
				subjectId: payload.review?.id?.toString(),
				subjectUrl: payload.review?.html_url ?? undefined,
			});
		} else if (reviewState === "dismissed") {
			facts.push({ ...base, type: "review_dismissed" });
		}
		facts.push(...this.mentionFacts(base, payload.review?.body));
		return facts;
	}

	private normalizePrComment(
		base: Omit<GithubNormalizedFact, "type">,
		payload: GithubWebhookPayload,
	): GithubNormalizedFact[] {
		const facts: GithubNormalizedFact[] = [];
		if (["created", "edited", "deleted"].includes(payload.action ?? "")) {
			facts.push({
				...base,
				type: `comment_${payload.action}` as
					| "comment_created"
					| "comment_edited"
					| "comment_deleted",
				subjectId: payload.comment?.id?.toString(),
				subjectUrl: payload.comment?.html_url ?? undefined,
			});
		}
		facts.push(...this.mentionFacts(base, payload.comment?.body));
		return facts;
	}

	private normalizeIssueComment(
		base: Omit<GithubNormalizedFact, "type">,
		payload: GithubWebhookPayload,
	): GithubNormalizedFact[] {
		if (!payload.issue?.pull_request) {
			return [];
		}
		return this.normalizePrComment(base, payload);
	}

	private normalizeCheck(
		base: Omit<GithubNormalizedFact, "type">,
		payload: GithubWebhookPayload,
	): GithubNormalizedFact[] {
		const check = payload.check_run ?? payload.check_suite;
		if (payload.action !== "completed" || !check) {
			return [];
		}
		return [
			{
				...base,
				type: "check_completed",
				subjectId: check.id?.toString(),
				subjectUrl: check.html_url ?? undefined,
				checkName: check.name ?? undefined,
				checkConclusion: check.conclusion ?? null,
				pullRequestNumber:
					base.pullRequestNumber ?? check.pull_requests?.[0]?.number,
			},
		];
	}

	private mentionFacts(
		base: Omit<GithubNormalizedFact, "type">,
		body: string | null | undefined,
	): GithubNormalizedFact[] {
		const mentionedLogins = extractMentions(body ?? "");
		if (mentionedLogins.length === 0) {
			return [];
		}
		return [{ ...base, type: "mention_detected", mentionedLogins }];
	}
}

export function extractMentions(body: string): string[] {
	const mentions = new Set<string>();
	for (const match of body.matchAll(MENTION_PATTERN)) {
		mentions.add(match[2].toLowerCase());
	}
	return [...mentions];
}
