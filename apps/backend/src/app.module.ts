import { Module } from "@nestjs/common";
import { AttentionModule } from "./attention/attention.module";
import { CommonModule } from "./common/common.module";
import { AppConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { GithubModule } from "./github/github.module";
import { HealthModule } from "./health/health.module";
import { LoggerModule } from "./logger/logger.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { SlackModule } from "./slack/slack.module";

@Module({
	imports: [
		AppConfigModule,
		LoggerModule,
		DatabaseModule,
		HealthModule,
		GithubModule,
		AttentionModule,
		SlackModule,
		SchedulerModule,
		CommonModule,
	],
})
export class AppModule {}
