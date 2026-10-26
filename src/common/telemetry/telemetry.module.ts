import { Module } from "@nestjs/common";
import { TelemetryShutdownService } from "./services/telemetry-shutdown.service";

@Module({ providers: [TelemetryShutdownService] })
export class TelemetryModule {}
