import { Module } from "@nestjs/common";
import { CatalogClient } from "./clients/catalog.client";
import { DependencyHttpClient } from "./clients/dependency-http.client";

@Module({
  providers: [DependencyHttpClient, CatalogClient],
  exports: [CatalogClient],
})
export class IntegrationsModule {}
