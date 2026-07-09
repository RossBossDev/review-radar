import { describe, expect, it } from "vitest";
import { AttentionCategory } from "../attention/attention.types";
import { DigestBuilder, type DigestMessageItem } from "./digest-builder";

describe("DigestBuilder", () => {
	const builder = new DigestBuilder();

	it("omits empty digests", () => {
		expect(builder.build([])).toBeUndefined();
	});

	it("groups categories in stable priority order", () => {
		const message = builder.build([
			item({
				category: AttentionCategory.WaitingOnOthers,
				repo: "acme/search",
				number: 55,
			}),
			item({
				category: AttentionCategory.FailedCi,
				repo: "acme/payments",
				number: 87,
			}),
			item({
				category: AttentionCategory.NeedsReview,
				repo: "acme/api",
				number: 281,
			}),
			item({
				category: AttentionCategory.WaitingOnResponse,
				repo: "acme/frontend",
				number: 412,
			}),
		]);

		expect(message?.text).toBe(
			"Good morning 👋 You have 4 PRs needing attention.",
		);

		const blocks = JSON.stringify(message?.blocks);
		expect(blocks.indexOf(":eyes: Needs review")).toBeLessThan(
			blocks.indexOf(":hourglass_flowing_sand: Waiting on your response"),
		);
		expect(
			blocks.indexOf(":hourglass_flowing_sand: Waiting on your response"),
		).toBeLessThan(blocks.indexOf(":x: Checks failed"));
		expect(blocks).toContain(
			"<https://github.example/acme/api/pull/281|api #281> — Example PR",
		);
		expect(blocks).toContain('"type":"divider"');
	});

	it("uses singular summary copy for one PR", () => {
		const message = builder.build([
			item({
				category: AttentionCategory.NeedsReview,
				repo: "acme/api",
				number: 281,
			}),
		]);

		expect(message?.text).toBe(
			"Good morning 👋 You have 1 PR needing attention.",
		);
	});
});

function item(params: {
	category: AttentionCategory;
	repo: string;
	number: number;
}): DigestMessageItem {
	return {
		id: `${params.repo}-${params.number}`,
		category: params.category,
		repositoryFullName: params.repo,
		pullRequestNumber: params.number,
		pullRequestTitle: "Example PR",
		pullRequestUrl: `https://github.example/${params.repo}/pull/${params.number}`,
	};
}
