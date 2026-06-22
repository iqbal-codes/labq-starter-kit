import { ORPCError } from "@orpc/server";
import type { ErrorCode } from "@admin-template/types";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { details?: Record<string, unknown>; statusCode?: number },
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = options?.details;
    this.statusCode = options?.statusCode ?? AppError.codeToStatus(code);
  }

  private static codeToStatus(code: ErrorCode): number {
    switch (code) {
      case "UNAUTHORIZED":
        return 401;
      case "FORBIDDEN":
        return 403;
      case "NOT_FOUND":
        return 404;
      case "VALIDATION_ERROR":
        return 400;
      case "MODULE_DISABLED":
        return 403;
      case "ORGANIZATION_REQUIRED":
        return 400;
      case "INTERNAL_ERROR":
      default:
        return 500;
    }
  }
}

export function throwNotFound(entity: string): never {
  throw new ORPCError("NOT_FOUND", { message: `${entity} not found` });
}

export function throwForbidden(message = "Insufficient permissions"): never {
  throw new ORPCError("FORBIDDEN", { message });
}
