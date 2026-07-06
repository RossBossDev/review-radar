import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import type { AppConfig } from "../config/app-config";

@Module({
	imports: [
		PinoLoggerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) => ({
				pinoHttp: {
					level: configService.get("LOG_LEVEL"),
					redact: [
						"req.headers.authorization",
						"req.headers.cookie",
						'res.headers["set-cookie"]',
					],
					transport:
						configService.get("NODE_ENV") === "development"
							? {
									target: "pino-pretty",
									options: { singleLine: true },
								}
							: undefined,
				},
			}),
		}),
	],
})
export class LoggerModule {}
