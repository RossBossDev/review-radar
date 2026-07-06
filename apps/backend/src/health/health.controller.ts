import { Controller, Get, Inject } from "@nestjs/common";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import type { Kysely } from "kysely";
import { KYSELY_DB } from "../database/database.tokens";
import type { Database } from "../database/database.types";

@Controller("health")
export class HealthController {
	constructor(
		@Inject(HealthCheckService) private readonly health: HealthCheckService,
		@Inject(KYSELY_DB) private readonly db: Kysely<Database>,
	) {}

	@Get("live")
	live() {
		return { status: "ok" };
	}

	@Get("ready")
	@HealthCheck()
	ready() {
		return this.health.check([
			async () => {
				await this.db
					.selectNoFrom((eb) => eb.val(1).as("ok"))
					.executeTakeFirstOrThrow();
				return { database: { status: "up" } };
			},
		]);
	}

	@Get()
	@HealthCheck()
	healthCheck() {
		return this.ready();
	}
}
