import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Response } from "express";

export const RequestId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    String(
      context.switchToHttp().getResponse<Response>().getHeader("X-Request-ID"),
    ),
);
