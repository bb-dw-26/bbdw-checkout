import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
for (const key of ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT", "SENTRY_RELEASE"]) {
  if (!process.env[key]) throw new Error(`Configure ${key} antes do upload.`);
}
if (process.env.SENTRY_PROJECT !== "bbdw-checkout") throw new Error("Use o projeto dedicado bbdw-checkout.");
const cli = require("@sentry/cli").SentryCli.getPath();
execFileSync(cli, ["sourcemaps", "upload", "dist/src", "--release", process.env.SENTRY_RELEASE, "--url-prefix", "app:///src", "--validate", "--strict"], { stdio: "inherit" });
