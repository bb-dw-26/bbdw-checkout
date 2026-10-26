import type { INestApplication } from "@nestjs/common";
import { RequestIdMiddleware } from "./middleware/request-id.middleware";

export function configureHttp(app: INestApplication) {
  // Antes do parser JSON e do CORS: inclusive erros de parsing e preflight recebem ID.
  const requestId = app.get(RequestIdMiddleware);
  app.use(requestId.use.bind(requestId));
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowedHeaders: [
      "Content-Type",
      "X-Request-ID",
      "Idempotency-Key",
      "X-Client-Release",
    ],
    exposedHeaders: ["X-Request-ID"],
  });
  app.enableShutdownHooks();
}
