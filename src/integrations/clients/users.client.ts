import { Inject, Injectable } from "@nestjs/common";
import { ApiError } from "../../common/http/exceptions/api.exception";
import { isRecord } from "../../common/utils/is-record";
import type { Customer } from "../types";
import { DependencyHttpClient } from "./dependency-http.client";

@Injectable()
export class UsersClient {
  constructor(
    @Inject(DependencyHttpClient) private readonly http: DependencyHttpClient,
  ) {}

  async find(id: string, requestId: string): Promise<Customer> {
    const value = await this.http.get(
      process.env.USERS_URL ?? "http://localhost:3001",
      `/users/${encodeURIComponent(id)}`,
      "CUSTOMER_NOT_FOUND",
      requestId,
    );
    if (
      !isRecord(value) ||
      value.id !== id ||
      !(
        value.address === null ||
        (isRecord(value.address) &&
          ["postalCode", "street", "city"].every(
            (key) =>
              typeof value.address === "object" &&
              value.address !== null &&
              typeof (value.address as Record<string, unknown>)[key] ===
                "string",
          ))
      )
    )
      throw new ApiError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Resposta inválida do serviço de clientes.",
      );
    return value as Customer;
  }
}
