import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureHttp } from "./common/http/configure-http";

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: false });
  configureHttp(app);
  return app;
}
