export type GithubWebhookEventName =
	| "pull_request"
	| "pull_request_review"
	| "pull_request_review_comment"
	| "issue_comment"
	| "check_suite"
	| "check_run"
	| string;

export type GithubFactType =
	| "review_requested"
	| "review_submitted"
	| "review_dismissed"
	| "comment_created"
	| "comment_edited"
	| "comment_deleted"
	| "mention_detected"
	| "check_completed"
	| "pr_merged"
	| "pr_closed"
	| "pr_reopened"
	| "pr_synchronized";

export interface GithubWebhookHeaders {
	deliveryId: string;
	eventName: GithubWebhookEventName;
	signature256: string;
}

export interface GithubUserRef {
	id: number | string;
	login: string;
	name?: string | null;
}

export interface GithubInstallationRef {
	id: number | string;
	account?: {
		login?: string | null;
		type?: string | null;
	} | null;
}

export interface GithubRepositoryRef {
	id: number | string;
	name: string;
	full_name: string;
	default_branch?: string | null;
	owner?: {
		login?: string | null;
	} | null;
}

export interface GithubPullRequestRef {
	id: number | string;
	number: number;
	title: string;
	state: string;
	draft?: boolean | null;
	merged?: boolean | null;
	merged_at?: string | null;
	closed_at?: string | null;
	html_url: string;
	created_at?: string | null;
	updated_at?: string | null;
	body?: string | null;
	user?: GithubUserRef | null;
	requested_reviewers?: GithubUserRef[];
}

export interface GithubIssueRef {
	number: number;
	pull_request?: unknown;
	body?: string | null;
	user?: GithubUserRef | null;
}

export interface GithubCommentRef {
	id: number | string;
	body?: string | null;
	html_url?: string | null;
	user?: GithubUserRef | null;
}

export interface GithubReviewRef {
	id: number | string;
	state?: string | null;
	body?: string | null;
	html_url?: string | null;
	user?: GithubUserRef | null;
}

export interface GithubCheckRef {
	id: number | string;
	name?: string | null;
	conclusion?: string | null;
	status?: string | null;
	html_url?: string | null;
	pull_requests?: Array<{ id?: number | string; number?: number }>;
}

export interface GithubWebhookPayload {
	action?: string;
	installation?: GithubInstallationRef;
	repository?: GithubRepositoryRef;
	pull_request?: GithubPullRequestRef;
	issue?: GithubIssueRef;
	comment?: GithubCommentRef;
	review?: GithubReviewRef;
	requested_reviewer?: GithubUserRef;
	check_suite?: GithubCheckRef;
	check_run?: GithubCheckRef;
}

export interface GithubNormalizedFact {
	type: GithubFactType;
	deliveryId: string;
	eventName: GithubWebhookEventName;
	action?: string;
	repositoryFullName?: string;
	pullRequestNumber?: number;
	githubPullRequestId?: string;
	actorLogin?: string;
	subjectId?: string;
	subjectUrl?: string;
	mentionedLogins?: string[];
	checkName?: string;
	checkConclusion?: string | null;
	occurredAt: Date;
}

export interface GithubIngestionResult {
	deliveryId: string;
	duplicate: boolean;
	facts: GithubNormalizedFact[];
}
