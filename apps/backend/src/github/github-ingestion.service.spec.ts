import { describe, expect, it, vi } from "vitest";
import type { GithubWebhookPayload } from "./github.types";
import { GithubIngestionService } from "./github-ingestion.service";
import { GithubNormalizer } from "./github-normalizer";

const payload: GithubWebhookPayload = {
	action: "opened",
	installation: { id: 123, account: { login: "org", type: "Organization" } },
	repository: { id: 1, name: "repo", full_name: "org/repo" },
	pull_request: {
		id: 10,
		number: 4,
		title: "Hello",
		state: "open",
		html_url: "https://github.com/org/repo/pull/4",
		body: "ping @reviewer",
		user: { id: 2, login: "author" },
	},
};

describe("GithubIngestionService", () => {
	it("does not snapshot, normalize, or publish duplicate deliveries", async () => {
		const eventStore = {
			persistRaw: vi
				.fn()
				.mockResolvedValue({ id: "event-id", duplicate: true }),
			markProcessed: vi.fn(),
		};
		const snapshots = { upsertFromPayload: vi.fn() };
		const normalizer = new GithubNormalizer();
		const service = new GithubIngestionService(
			eventStore as never,
			snapshots as never,
			normalizer,
		);
		const listener = vi.fn();
		service.onFacts(listener);

		const result = await service.ingest(
			{ deliveryId: "delivery-id", eventName: "pull_request" },
			payload,
		);

		expect(result).toEqual({
			deliveryId: "delivery-id",
			duplicate: true,
			facts: [],
		});
		expect(snapshots.upsertFromPayload).not.toHaveBeenCalled();
		expect(eventStore.markProcessed).not.toHaveBeenCalled();
		expect(listener).not.toHaveBeenCalled();
	});

	it("snapshots and publishes normalized facts after a new raw event is stored", async () => {
		const eventStore = {
			persistRaw: vi
				.fn()
				.mockResolvedValue({ id: "event-id", duplicate: false }),
			markProcessed: vi.fn(),
		};
		const snapshots = {
			upsertFromPayload: vi.fn().mockResolvedValue({
				installationId: "installation-id",
				repositoryId: "repository-id",
				pullRequestId: "pull-request-id",
			}),
		};
		const service = new GithubIngestionService(
			eventStore as never,
			snapshots as never,
			new GithubNormalizer(),
		);
		const listener = vi.fn();
		service.onFacts(listener);

		const result = await service.ingest(
			{ deliveryId: "delivery-id", eventName: "pull_request" },
			payload,
		);

		expect(result.duplicate).toBe(false);
		expect(result.facts).toMatchObject([
			{ type: "mention_detected", mentionedLogins: ["reviewer"] },
		]);
		expect(eventStore.markProcessed).toHaveBeenCalledWith({
			eventId: "event-id",
			installationId: "installation-id",
			repositoryId: "repository-id",
		});
		expect(listener).toHaveBeenCalledWith(result.facts);
	});
});
