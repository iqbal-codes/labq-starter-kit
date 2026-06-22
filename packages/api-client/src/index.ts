import { createORPCClient, type NestedClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        toast.error(`Error: ${error.message}`, {
          action: {
            label: "retry",
            onClick: () => query.invalidate(),
          },
        });
      },
    }),
  });
}

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
