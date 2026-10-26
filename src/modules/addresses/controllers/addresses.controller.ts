import { Controller, Get, Inject, Param } from "@nestjs/common";
import { RequestId } from "../../../common/http/decorators/request-id.decorator";
import { ViaCepClient } from "../clients/viacep.client";

@Controller("addresses")
export class AddressesController {
  constructor(@Inject(ViaCepClient) private readonly addresses: ViaCepClient) {}

  @Get(":postalCode")
  find(@Param("postalCode") postalCode: string, @RequestId() requestId: string) {
    return this.addresses.find(postalCode, requestId);
  }
}
