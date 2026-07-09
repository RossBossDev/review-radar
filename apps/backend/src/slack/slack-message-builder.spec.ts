import { describe, expect, it } from "vitest";
import {
	AttentionCategory,
	AttentionStatus,
} from "../attention/attention.types";
import { SlackMessageBuilder } from "./slack-message-builder";

describe("SlackMessageBuilder", () => {
	const builder = new SlackMessageBuilder();

	it.each([
		[AttentionCategory.NeedsReview, ":eyes: You were requested for review"],
		[AttentionCategory.Mentioned, ":thread: You were mentioned"],
		[
			AttentionCategory.NewComments,
			":speech_balloon: New comments need your attention",
		],
		[AttentionCategory.FailedCi, ":x: Checks failed"],
		[
			AttentionCategory.StaleReviewRequest,
			":zzz: Review request is getting stale",
		],
	])("formats polished card text for %s", (category, expected) => {
		const message = builder.buildAttentionMessage({
			id: "attention-1",
			category,
			assigneeLogin: "octo",
			reason: "John requested your review",
			pullRequest: {
				number: 413,
				title: "Improve payments",
				htmlUrl: "https://github.example/pr/413",
				repositoryFullName: "acme/payments-api",
			},
		});

		expect(message.text).toBe(`${expected} — Improve payments`);
		expect(JSON.stringify(message.blocks)).toContain("Improve payments");
		expect(JSON.stringify(message.blocks)).toContain("acme/payments-api");
		expect(JSON.stringify(message.blocks)).toContain("Mark handled");
	});

	it("uses category-specific primary actions", () => {
		const message = builder.buildAttentionMessage({
			id: "attention-1",
			category: AttentionCategory.FailedCi,
			assigneeLogin: "octo",
			reason: "Checks failed",
			pullRequest: {
				number: 413,
				title: "Improve payments",
				htmlUrl: "https://github.example/pr/413",
				repositoryFullName: "acme/payments-api",
			},
		});

		expect(JSON.stringify(message.blocks)).toContain("Check CI");
	});

	it("formats an empty inbox", () => {
		expect(builder.buildInboxText([])).toBe(
			"🎉 Nothing needs your attention right now.",
		);
	});

	it("formats inbox items", () => {
		expect(
			builder.buildInboxText([
				{
					id: "attention-1",
					pullRequestId: "pr-1",
					category: AttentionCategory.NewComments,
					status: AttentionStatus.Active,
					assigneeGithubUserId: null,
					assigneeLogin: "octo",
					reason: "2 new comments",
					dedupeKey: "key",
					detectedAt: new Date(),
					lastRelevantActivityAt: new Date(),
					resolvedAt: null,
					updatedAt: new Date(),
				},
			]),
		).toContain(
			":speech_balloon: New comments need your attention — 2 new comments",
		);
	});

	it("formats an empty home view with personality", () => {
		expect(JSON.stringify(builder.buildHomeView([]))).toContain("You’re clear");
	});
});
