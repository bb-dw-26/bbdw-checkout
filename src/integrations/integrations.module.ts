import { Module } from "@nestjs/common";
import { CatalogClient } from "./clients/catalog.client";
import { DependencyHttpClient } from "./clients/dependency-http.client";
import { UsersClient } from "./clients/users.client";

@Module({
  providers: [DependencyHttpClient, UsersClient, CatalogClient],
  exports: [UsersClient, CatalogClient],
})
export class IntegrationsModule {}
