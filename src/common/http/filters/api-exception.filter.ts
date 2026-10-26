import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Response } from "express";
import { captureServerError } from "../../telemetry/telemetry";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    const detail = error instanceof HttpException ? error.getResponse() : null;
    const body =
      typeof detail === "object" && detail !== null
        ? (detail as Record<string, unknown>)
        : {};
    response.status(status).json({
      error: {
        code:
          typeof body.code === "string"
            ? body.code
            : status === 500
              ? "INTERNAL_ERROR"
              : `HTTP_${status}`,
        message:
          status >= 500
            ? "Não foi possível concluir a operação."
            : (body.message ?? "Requisição inválida."),
      },
      requestId: response.getHeader("X-Request-ID"),
    });
    if (status >= 500) {
      captureServerError(error, String(response.getHeader("X-Request-ID")));
      console.error(error);
    }
  }
}
