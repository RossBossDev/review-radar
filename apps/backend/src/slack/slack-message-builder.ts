import { Injectable } from "@nestjs/common";
import {
	AttentionCategory,
	type AttentionQueryItem,
} from "../attention/attention.types";
import type { SlackMessageContext } from "./slack.types";

@Injectable()
export class SlackMessageBuilder {
	buildAttentionMessage(item: SlackMessageContext): {
		text: string;
		blocks: unknown[];
	} {
		const presentation = this.presentationFor(item.category);
		const prLabel = `${item.pullRequest.repositoryFullName} #${item.pullRequest.number}`;
		const text = `${presentation.icon} ${presentation.notificationTitle} — ${item.pullRequest.title}`;

		return {
			text,
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: [
							`*${presentation.icon} ${presentation.notificationTitle}*`,
							`*<${item.pullRequest.htmlUrl}|${item.pullRequest.title}>*`,
							`${prLabel}`,
							"",
							item.reason,
						].join("\n"),
					},
				},
				{
					type: "context",
					elements: [
						{
							type: "mrkdwn",
							text: `${presentation.contextLabel} • ${item.pullRequest.repositoryFullName} • PR #${item.pullRequest.number}`,
						},
					],
				},
				{
					type: "actions",
					elements: [
						{
							type: "button",
							text: { type: "plain_text", text: presentation.primaryAction },
							url: item.pullRequest.htmlUrl,
						},
						{
							type: "button",
							text: { type: "plain_text", text: "Mark handled" },
							value: item.id,
							action_id: "acknowledge_attention_item",
						},
					],
				},
			],
		};
	}

	buildInboxText(items: AttentionQueryItem[]): string {
		if (items.length === 0) {
			return "🎉 Nothing needs your attention right now.";
		}
		return items
			.map((item) => {
				const presentation = this.presentationFor(item.category);
				return `• ${presentation.icon} ${presentation.notificationTitle} — ${item.reason}`;
			})
			.join("\n");
	}

	buildHomeView(items: AttentionQueryItem[]): unknown {
		const blocks =
			items.length === 0
				? [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: "*🎉 You’re clear*\nReview Radar will surface PRs here when something needs your attention.",
							},
						},
					]
				: this.groupHomeBlocks(items);

		return {
			type: "home",
			blocks: [
				{
					type: "header",
					text: { type: "plain_text", text: "Review Radar Inbox" },
				},
				...blocks,
			],
		};
	}

	private groupHomeBlocks(items: AttentionQueryItem[]): unknown[] {
		const groups = new Map<AttentionCategory, AttentionQueryItem[]>();
		for (const item of items) {
			groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
		}

		return [...groups.entries()].flatMap(([category, group]) => {
			const presentation = this.presentationFor(category);
			return [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*${presentation.icon} ${presentation.notificationTitle}*`,
					},
				},
				...group.map((item) => ({
					type: "section",
					text: { type: "mrkdwn", text: `• ${item.reason}` },
				})),
			];
		});
	}

	private presentationFor(category: AttentionCategory): {
		icon: string;
		notificationTitle: string;
		contextLabel: string;
		primaryAction: string;
	} {
		switch (category) {
			case AttentionCategory.NeedsReview:
				return {
					icon: ":eyes:",
					notificationTitle: "You were requested for review",
					contextLabel: "Review requested",
					primaryAction: "Review PR",
				};
			case AttentionCategory.Mentioned:
				return {
					icon: ":thread:",
					notificationTitle: "You were mentioned",
					contextLabel: "Mentioned",
					primaryAction: "Open PR",
				};
			case AttentionCategory.NewComments:
				return {
					icon: ":speech_balloon:",
					notificationTitle: "New comments need your attention",
					contextLabel: "New comments",
					primaryAction: "View comments",
				};
			case AttentionCategory.FailedCi:
				return {
					icon: ":x:",
					notificationTitle: "Checks failed",
					contextLabel: "Failed CI",
					primaryAction: "Check CI",
				};
			case AttentionCategory.StaleReviewRequest:
				return {
					icon: ":zzz:",
					notificationTitle: "Review request is getting stale",
					contextLabel: "Stale review request",
					primaryAction: "Review PR",
				};
			case AttentionCategory.WaitingOnResponse:
				return {
					icon: ":hourglass_flowing_sand:",
					notificationTitle: "Waiting on your response",
					contextLabel: "Waiting on response",
					primaryAction: "Respond",
				};
			case AttentionCategory.WaitingOnOthers:
				return {
					icon: ":hourglass:",
					notificationTitle: "Waiting on others",
					contextLabel: "Waiting on others",
					primaryAction: "Open PR",
				};
			case AttentionCategory.ClosedOrMerged:
				return {
					icon: ":white_check_mark:",
					notificationTitle: "PR resolved",
					contextLabel: "Resolved",
					primaryAction: "Open PR",
				};
		}
	}
}
