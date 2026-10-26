import { Module } from "@nestjs/common";
import { AddressesController } from "./controllers/addresses.controller";
import { ViaCepClient } from "./clients/viacep.client";

@Module({ controllers: [AddressesController], providers: [ViaCepClient] })
export class AddressesModule {}
