import {
	BadRequestException,
	Body,
	Controller,
	Headers,
	Inject,
	Post,
	Req,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { AppConfig } from "../config/app-config";
import type { GithubWebhookPayload } from "./github.types";
import { GithubIngestionService } from "./github-ingestion.service";
import { GithubWebhookVerifier } from "./github-webhook-verifier";

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller("webhooks/github")
export class GithubController {
	constructor(
		@Inject(GithubWebhookVerifier)
		private readonly verifier: GithubWebhookVerifier,
		@Inject(GithubIngestionService)
		private readonly ingestion: GithubIngestionService,
		@Inject(ConfigService)
		private readonly configService: ConfigService<AppConfig, true>,
	) {}

	@Post()
	async receiveWebhook(
		@Req() request: RawBodyRequest,
		@Body() payload: GithubWebhookPayload,
		@Headers("x-hub-signature-256") signature256?: string,
		@Headers("x-github-delivery") deliveryId?: string,
		@Headers("x-github-event") eventName?: string,
	) {
		if (!signature256 || !deliveryId || !eventName) {
			throw new BadRequestException("Missing required GitHub webhook headers");
		}

		const rawBody = request.rawBody;
		if (!rawBody) {
			throw new BadRequestException("Missing raw request body");
		}

		const valid = this.verifier.verify(
			rawBody,
			signature256,
			this.configService.get("GITHUB_WEBHOOK_SECRET"),
		);
		if (!valid) {
			throw new UnauthorizedException("Invalid GitHub webhook signature");
		}

		const result = await this.ingestion.ingest(
			{ deliveryId, eventName },
			payload,
		);

		return {
			status: result.duplicate ? "duplicate" : "accepted",
			deliveryId: result.deliveryId,
			facts: result.facts.length,
		};
	}
}
