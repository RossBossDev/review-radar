import { Injectable } from "@nestjs/common";
import { AttentionCategory } from "../attention/attention.types";

export interface DigestMessageItem {
	id: string;
	category: AttentionCategory;
	repositoryFullName: string;
	pullRequestNumber: number;
	pullRequestTitle: string;
	pullRequestUrl: string;
}

export interface DigestMessage {
	text: string;
	blocks: unknown[];
}

const CATEGORY_ORDER = [
	AttentionCategory.NeedsReview,
	AttentionCategory.WaitingOnResponse,
	AttentionCategory.FailedCi,
	AttentionCategory.WaitingOnOthers,
	AttentionCategory.Mentioned,
	AttentionCategory.NewComments,
	AttentionCategory.StaleReviewRequest,
] as const;

@Injectable()
export class DigestBuilder {
	build(items: DigestMessageItem[]): DigestMessage | undefined {
		if (items.length === 0) {
			return undefined;
		}

		const groupedBlocks = CATEGORY_ORDER.flatMap((category) => {
			const categoryItems = items.filter((item) => item.category === category);
			if (categoryItems.length === 0) {
				return [];
			}

			return [
				{ type: "divider" },
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*${this.headingFor(category)}*`,
					},
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: categoryItems.map((item) => this.itemLine(item)).join("\n"),
					},
				},
			];
		});

		const text = `Good morning 👋 You have ${items.length} ${this.pluralize("PR", items.length)} needing attention.`;

		return {
			text,
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*Good morning 👋*\nYou have *${items.length}* ${this.pluralize("PR", items.length)} needing attention.`,
					},
				},
				...groupedBlocks,
			],
		};
	}

	private itemLine(item: DigestMessageItem): string {
		const repositoryName = item.repositoryFullName.split("/").at(-1);
		return `• <${item.pullRequestUrl}|${repositoryName} #${item.pullRequestNumber}> — ${item.pullRequestTitle}`;
	}

	private headingFor(category: AttentionCategory): string {
		switch (category) {
			case AttentionCategory.NeedsReview:
				return ":eyes: Needs review";
			case AttentionCategory.WaitingOnResponse:
				return ":hourglass_flowing_sand: Waiting on your response";
			case AttentionCategory.FailedCi:
				return ":x: Checks failed";
			case AttentionCategory.WaitingOnOthers:
				return ":hourglass: Waiting on others";
			case AttentionCategory.Mentioned:
				return ":thread: Mentioned";
			case AttentionCategory.NewComments:
				return ":speech_balloon: New comments";
			case AttentionCategory.StaleReviewRequest:
				return ":zzz: Stale review requests";
			case AttentionCategory.ClosedOrMerged:
				return ":white_check_mark: Resolved";
		}
	}

	private pluralize(noun: string, count: number): string {
		return count === 1 ? noun : `${noun}s`;
	}
}
