import { describe, expect, it } from "vitest";
import { GithubWebhookVerifier } from "./github-webhook-verifier";

describe("GithubWebhookVerifier", () => {
	const verifier = new GithubWebhookVerifier();
	const body = Buffer.from(JSON.stringify({ action: "opened" }));

	it("accepts a valid sha256 signature", () => {
		const signature = verifier.formatSignature(body, "secret");

		expect(verifier.verify(body, signature, "secret")).toBe(true);
	});

	it("rejects an invalid sha256 signature", () => {
		const signature = verifier.formatSignature(body, "secret");

		expect(verifier.verify(body, signature, "other-secret")).toBe(false);
	});
});
