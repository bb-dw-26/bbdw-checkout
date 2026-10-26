import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ApiError } from "../../../common/http/exceptions/api.exception";
import { UsersClient } from "../../../integrations/clients/users.client";
import { CatalogClient } from "../../../integrations/clients/catalog.client";
import type { CreateOrderDto } from "../dto/create-order.dto";
import { IdempotencyStore } from "../stores/idempotency.store";

function invalid(code: string, message: string): never {
  throw new ApiError(422, code, message);
}

@Injectable()
export class OrdersService {
  private readonly attempts = new IdempotencyStore<
    Awaited<ReturnType<OrdersService["perform"]>>
  >();
  constructor(
    @Inject(UsersClient) private readonly users: UsersClient,
    @Inject(CatalogClient) private readonly catalog: CatalogClient,
  ) {}
  async create(
    input: CreateOrderDto,
    requestId: string,
    key?: string,
    clientRelease?: string,
  ) {
    const fingerprint = JSON.stringify({
      customerId: input.customerId,
      fulfillment: input.fulfillment,
      items: input.items
        .map(({ productId, quantity }) => ({ productId, quantity }))
        .sort((a, b) => a.productId.localeCompare(b.productId)),
    });
    return this.attempts.run(key, fingerprint, requestId, clientRelease, () =>
      this.perform(input, requestId),
    );
  }
  private async perform(input: CreateOrderDto, requestId: string) {
    const customer = await this.users.find(input.customerId, requestId);
    const postalCode = customer.address!.postalCode;
    if (input.fulfillment === "delivery" && !customer.address)
      invalid(
        "ADDRESS_REQUIRED",
        "Este cliente não possui endereço para entrega.",
      );
    const items = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.catalog.find(item.productId, requestId);
        if (!product.available)
          invalid("PRODUCT_UNAVAILABLE", "Produto indisponível.");
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
        };
      }),
    );
    const totalCents = items.reduce(
      (total, item) => total + item.unitPriceCents * item.quantity,
      0,
    );
    if (!Number.isSafeInteger(totalCents))
      throw new ApiError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Preço fora do limite suportado.",
      );
    return {
      id: randomUUID(),
      customerId: customer.id,
      fulfillment: input.fulfillment,
      deliveryAddress:
        input.fulfillment === "delivery" ? { ...customer.address, postalCode } : null,
      items,
      totalCents,
      currency: "BRL",
      status: "confirmed",
    };
  }
}
