import { Injectable } from "@nestjs/common";

export interface GithubReconciliationRequest {
	installationId?: string;
	repositoryFullName?: string;
	pullRequestNumber?: number;
}

@Injectable()
export class GithubReconciliationService {
	async reconcilePullRequest(
		_request: GithubReconciliationRequest,
	): Promise<void> {
		// Placeholder for a future GitHub API refresh that repairs missed webhooks
		// without changing the webhook-driven ingestion contract.
	}
}
