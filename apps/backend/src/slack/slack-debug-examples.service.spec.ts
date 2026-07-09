import { describe, expect, it, vi } from "vitest";
import { DigestBuilder } from "../notifications/digest-builder";
import { SlackDebugExamplesService } from "./slack-debug-examples.service";
import { SlackMessageBuilder } from "./slack-message-builder";

describe("SlackDebugExamplesService", () => {
	it("sends three example messages to the requested Slack user", async () => {
		const slack = {
			postMessage: vi
				.fn()
				.mockResolvedValue({ channel: "U123", ts: "123.456" }),
		};
		const service = new SlackDebugExamplesService(
			new SlackMessageBuilder(),
			new DigestBuilder(),
			slack as never,
		);

		const sentCount = await service.sendExamplesToSlackUser("U123");

		expect(sentCount).toBe(3);
		expect(slack.postMessage).toHaveBeenCalledTimes(3);
		expect(slack.postMessage).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				channel: "U123",
				text: ":eyes: You were requested for review — Add webhook retry handling",
			}),
		);
		expect(slack.postMessage).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				channel: "U123",
				text: ":hourglass_flowing_sand: Waiting on your response — Refine Slack digest formatting",
			}),
		);
		expect(slack.postMessage).toHaveBeenNthCalledWith(
			3,
			expect.objectContaining({
				channel: "U123",
				text: expect.stringContaining("Good morning 👋"),
			}),
		);
	});
});
