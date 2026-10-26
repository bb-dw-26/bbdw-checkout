import { Module } from "@nestjs/common";
import { HttpModule } from "./common/http/http.module";
import { HealthModule } from "./modules/health/health.module";
import { AddressesModule } from "./modules/addresses/addresses.module";
import { OrdersModule } from "./modules/orders/orders.module";

@Module({ imports: [HttpModule, HealthModule, OrdersModule, AddressesModule] })
export class AppModule {}
