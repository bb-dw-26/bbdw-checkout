import "./common/telemetry/instrument";
import "reflect-metadata";
import { createApp } from "./app";

async function bootstrap() {
  const app = await createApp();
  await app.listen(Number(process.env.PORT ?? 3003), "0.0.0.0");
}
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
