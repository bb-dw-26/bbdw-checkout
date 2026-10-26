import type { ValidationError } from "class-validator";
import { ApiError } from "./api.exception";

// Apenas adapta os erros dos decorators ao contrato HTTP existente.
// As regras de validação ficam nos DTOs e são executadas pelo ValidationPipe do Nest.
function firstError(errors: ValidationError[]): ApiError | undefined {
  for (const error of errors) {
    const nested = firstError(error.children ?? []);
    if (nested) return nested;
    for (const [constraint, message] of Object.entries(error.constraints ?? {})) {
      const context = error.contexts?.[constraint] as
        | { code?: unknown }
        | undefined;
      if (typeof context?.code === "string")
        return new ApiError(422, context.code, message);
    }
  }
}

export function validationExceptionFactory(errors: ValidationError[]): ApiError {
  return firstError(errors) ?? new ApiError(422, "INVALID_INPUT", "Requisição inválida.");
}
