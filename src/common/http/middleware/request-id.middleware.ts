import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const supplied = request.header("X-Request-ID");
    const id =
      supplied && /^[a-zA-Z0-9._-]{1,128}$/.test(supplied)
        ? supplied
        : randomUUID();
    response.setHeader("X-Request-ID", id);
    next();
  }
}
