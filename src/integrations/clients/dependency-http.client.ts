import { Injectable } from "@nestjs/common";
import { ApiError } from "../../common/http/exceptions/api.exception";

@Injectable()
export class DependencyHttpClient {
  async get(
    base: string,
    path: string,
    missing: string,
    requestId: string,
  ): Promise<unknown> {
    try {
      const response = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(
          Number(process.env.DEPENDENCY_TIMEOUT_MS ?? 2000),
        ),
        headers: { "X-Request-ID": requestId },
      });
      if (response.status === 404)
        throw new ApiError(422, missing, "Cadastro não encontrado.");
      if (!response.ok)
        throw new Error(`Dependência retornou ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "Serviço temporariamente indisponível.",
      );
    }
  }
}
