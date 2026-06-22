import { createORPCClient, type NestedClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApiErrorResponse, ErrorCode } from "@admin-template/types";

// ── Error extraction ──────────────────────────────────────
export type ExtractedError = {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

/**
 * Extract a structured error from any error source.
 * Handles: ApiErrorResponse from fetch, oRPC errors, plain Error, and unknown values.
 */
export function getApiError(error: unknown): ExtractedError {
  // Already a structured API error response (from non-oRPC routes)
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as any).error === "object"
  ) {
    const apiErr = (error as ApiErrorResponse).error;
    return {
      code: (apiErr.code as ErrorCode) ?? "INTERNAL_ERROR",
      message: apiErr.message ?? "An error occurred",
      details: apiErr.details,
    };
  }

  // oRPC errors come through as Error with a `data` property
  if (error instanceof Error && "data" in error) {
    const data = (error as any).data;
    return {
      code: (data?.code as ErrorCode) ?? "INTERNAL_ERROR",
      message: error.message ?? data?.message ?? "An error occurred",
      details: data?.details,
    };
  }

  // Standard Error
  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: error.message || "An unexpected error occurred",
    };
  }

  // Unknown
  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
}

// ── Query Client ──────────────────────────────────────────
export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const { code, message } = getApiError(error);
        toast.error(message, {
          description: code !== "INTERNAL_ERROR" ? code : undefined,
          action: {
            label: "retry",
            onClick: () => query.invalidate(),
          },
        });
      },
    }),
  });
}

// ── oRPC Client ───────────────────────────────────────────
type ClientContext = Record<string, never>;

export function createOrpcLink(baseUrl: string) {
  return new RPCLink<ClientContext>({
    url: `${baseUrl}/rpc`,
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
}

export function createApiClient<T = NestedClient<any>>(link: RPCLink<ClientContext>): T {
  return createORPCClient(link) as T;
}

export function createOrpc<TClient extends NestedClient<any>>(client: TClient) {
  return createTanstackQueryUtils(client);
}
