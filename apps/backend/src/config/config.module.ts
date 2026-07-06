import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { validate } from "./app-config";

@Module({
	imports: [
		NestConfigModule.forRoot({
			isGlobal: true,
			validate,
		}),
	],
})
export class AppConfigModule {}
