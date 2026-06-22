import { ORPCError } from "@orpc/server";

export function throwNotFound(entity: string): never {
  throw new ORPCError("NOT_FOUND", { message: `${entity} not found` });
}

export function throwForbidden(message = "Insufficient permissions"): never {
  throw new ORPCError("FORBIDDEN", { message });
}

