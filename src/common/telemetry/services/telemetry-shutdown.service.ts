import * as Sentry from "@sentry/node";
import { Injectable, type OnApplicationShutdown } from "@nestjs/common";

@Injectable()
export class TelemetryShutdownService implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await Sentry.flush(2000);
  }
}
