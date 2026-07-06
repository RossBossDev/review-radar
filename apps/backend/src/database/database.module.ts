import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { AppConfig } from "../config/app-config";
import { KYSELY_DB, PG_POOL } from "./database.tokens";
import type { Database } from "./database.types";

@Module({
	providers: [
		{
			provide: PG_POOL,
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) =>
				new Pool({ connectionString: configService.get("DATABASE_URL") }),
		},
		{
			provide: KYSELY_DB,
			inject: [PG_POOL],
			useFactory: (pool: Pool) =>
				new Kysely<Database>({ dialect: new PostgresDialect({ pool }) }),
		},
	],
	exports: [PG_POOL, KYSELY_DB],
})
export class DatabaseModule {}
