import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { TelemetryModule } from "../telemetry/telemetry.module";
import { ApiExceptionFilter } from "./filters/api-exception.filter";
import { RequestIdMiddleware } from "./middleware/request-id.middleware";

@Module({
  imports: [TelemetryModule],
  providers: [
    RequestIdMiddleware,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
  exports: [RequestIdMiddleware],
})
export class HttpModule {}
