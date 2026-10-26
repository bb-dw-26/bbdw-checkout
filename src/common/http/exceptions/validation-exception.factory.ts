import type { ValidationError } from "class-validator";
import { ApiError } from "./api.exception";

// Apenas adapta os erros dos decorators ao contrato HTTP existente.
// As regras de validação ficam nos DTOs e são executadas pelo ValidationPipe do Nest.
function firstError(errors: ValidationError[]): ApiError | undefined {
  for (const error of errors) {
    // Um container inválido deve ser reportado antes dos seus elementos.
    for (const constraint of ["isArray", "arrayNotEmpty"]) {
      const shapeError = fromConstraint(error, constraint);
      if (shapeError) return shapeError;
    }
    const nested = firstError(error.children ?? []);
    if (nested) return nested;
    for (const constraint of Object.keys(error.constraints ?? {})) {
      const detail = fromConstraint(error, constraint);
      if (detail) return detail;
    }
  }
}

function fromConstraint(error: ValidationError, constraint: string) {
  const message = error.constraints?.[constraint];
  const context = error.contexts?.[constraint] as { code?: unknown } | undefined;
  if (message && typeof context?.code === "string")
    return new ApiError(422, context.code, message);
}

export function validationExceptionFactory(errors: ValidationError[]): ApiError {
  return (
    firstError(errors) ??
    new ApiError(422, "INVALID_INPUT", "Requisição inválida.")
  );
}
