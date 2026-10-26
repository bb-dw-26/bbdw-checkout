import { Injectable } from "@nestjs/common";
import { ApiError } from "../../../common/http/exceptions/api.exception";
import { captureServerError } from "../../../common/telemetry/telemetry";

type ViaCepResponse = { cep: string; logradouro: string; bairro: string; localidade: string; uf: string; erro?: boolean | string };

@Injectable()
export class ViaCepClient {
  async find(rawPostalCode: string, requestId: string) {
    const postalCode = rawPostalCode.trim().replace(/^(\d{5})-(\d{3})$/, "$1$2");
    if (!/^\d{8}$/.test(postalCode))
      throw new ApiError(422, "INVALID_POSTAL_CODE", "Informe um CEP com oito dígitos.");
    let data: ViaCepResponse;
    try {
      const base = process.env.VIACEP_BASE_URL || "https://viacep.com.br/ws";
      const response = await fetch(`${base.replace(/\/$/, "")}/${postalCode}/json/`, {
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) throw new Error("Address provider unavailable");
      data = await response.json() as ViaCepResponse;
    } catch {
      throw new ApiError(503, "ADDRESS_LOOKUP_UNAVAILABLE", "Não foi possível consultar o CEP. Tente novamente.");
    }
    if (data?.erro === true || data?.erro === "true")
      throw new ApiError(404, "POSTAL_CODE_NOT_FOUND", "CEP não encontrado.");
    try {
      return {
        postalCode,
        street: data.logradouro.trim(),
        neighborhood: data.bairro.trim(),
        city: data.localidade.trim(),
        state: data.uf.trim().toUpperCase(),
      };
    } catch (error) {
      captureServerError(error, requestId, { scenario: "CHK-004", error_code: "ADDRESS_LOOKUP_FAILED", provider: "viacep" });
      // A captura acima não inclui a resposta do provedor ou o endereço consultado.
      // O filtro HTTP reconhece a instância para não capturar a mesma exceção duas vezes.
      throw error;
    }
  }
}
