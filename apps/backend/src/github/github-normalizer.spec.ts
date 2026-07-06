import { describe, expect, it } from "vitest";
import { extractMentions, GithubNormalizer } from "./github-normalizer";

const receivedAt = new Date("2026-07-05T00:00:00.000Z");

describe("GithubNormalizer", () => {
	const normalizer = new GithubNormalizer();

	it("detects unique GitHub mentions in pull request bodies", () => {
		expect(
			extractMentions("Thanks @RossBossDev, @octo-cat and @octo-cat."),
		).toEqual(["rossbossdev", "octo-cat"]);
	});

	it("normalizes review requests and mentions from pull request payloads", () => {
		const facts = normalizer.normalize({
			deliveryId: "delivery-1",
			eventName: "pull_request",
			receivedAt,
			payload: {
				action: "review_requested",
				repository: { id: 1, name: "repo", full_name: "org/repo" },
				requested_reviewer: { id: 42, login: "reviewer" },
				pull_request: {
					id: 100,
					number: 7,
					title: "Add thing",
					state: "open",
					html_url: "https://github.com/org/repo/pull/7",
					body: "cc @teammate",
					user: { id: 1, login: "author" },
				},
			},
		});

		expect(facts).toMatchObject([
			{ type: "review_requested", actorLogin: "reviewer" },
			{ type: "mention_detected", mentionedLogins: ["teammate"] },
		]);
	});

	it("ignores non-pull-request issue comments", () => {
		const facts = normalizer.normalize({
			deliveryId: "delivery-2",
			eventName: "issue_comment",
			receivedAt,
			payload: {
				action: "created",
				issue: { number: 3 },
				comment: { id: 99, body: "@someone" },
			},
		});

		expect(facts).toEqual([]);
	});

	it("normalizes completed checks with enough pull request context", () => {
		const facts = normalizer.normalize({
			deliveryId: "delivery-3",
			eventName: "check_run",
			receivedAt,
			payload: {
				action: "completed",
				repository: { id: 1, name: "repo", full_name: "org/repo" },
				check_run: {
					id: 55,
					name: "ci",
					conclusion: "failure",
					pull_requests: [{ number: 7 }],
				},
			},
		});

		expect(facts).toMatchObject([
			{
				type: "check_completed",
				checkName: "ci",
				checkConclusion: "failure",
				pullRequestNumber: 7,
			},
		]);
	});
});
