import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsObject,
  IsDefined,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { DeliveryAddressDto } from "./delivery-address.dto";
import { OrderItemDto } from "./order-item.dto";

const cartError = {
  message: "Adicione um produto ao carrinho.",
  context: { code: "EMPTY_CART" },
};
const productError = {
  message: "Produto inválido.",
  context: { code: "PRODUCT_NOT_FOUND" },
};

export class CreateOrderDto {
  @IsIn(["pickup", "delivery"], {
    message: "Selecione retirada ou entrega.",
    context: { code: "INVALID_FULFILLMENT" },
  })
  fulfillment!: "pickup" | "delivery";

  @IsArray(cartError)
  @ArrayNotEmpty(cartError)
  @ArrayUnique((item: OrderItemDto | null) => item?.productId, {
    message: "Agrupe as quantidades do mesmo produto.",
    context: { code: "DUPLICATE_PRODUCT" },
  })
  @IsObject({ each: true, ...productError })
  @ValidateNested({ each: true, ...productError })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateIf((input: CreateOrderDto) => input.fulfillment === "delivery")
  @IsDefined({ message: "Informe o endereço de entrega.", context: { code: "ADDRESS_REQUIRED" } })
  @IsObject({ message: "Informe um endereço válido.", context: { code: "INVALID_ADDRESS" } })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto | null;
}
