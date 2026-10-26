import { Inject, Injectable } from "@nestjs/common";
import { ApiError } from "../../common/http/exceptions/api.exception";
import { isRecord } from "../../common/utils/is-record";
import type { Product } from "../types";
import { DependencyHttpClient } from "./dependency-http.client";

@Injectable()
export class CatalogClient {
  constructor(
    @Inject(DependencyHttpClient) private readonly http: DependencyHttpClient,
  ) {}

  async find(id: string, requestId: string): Promise<Product> {
    const value = await this.http.get(
      process.env.CATALOG_URL ?? "http://localhost:3002",
      `/products/${encodeURIComponent(id)}`,
      "PRODUCT_NOT_FOUND",
      requestId,
    );
    if (
      !isRecord(value) ||
      value.id !== id ||
      typeof value.priceCents !== "number" ||
      !Number.isSafeInteger(value.priceCents) ||
      value.priceCents < 0 ||
      value.currency !== "BRL" ||
      typeof value.available !== "boolean"
    )
      throw new ApiError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Resposta inválida do catálogo.",
      );
    return value as Product;
  }
}
