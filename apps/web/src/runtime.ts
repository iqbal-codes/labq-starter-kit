import {
  createQueryClient,
  createOrpcLink,
  createApiClient,
  createOrpc,
} from "@labq-modules/api-client";
import type { AppRouterClient } from "@labq-modules/api/routers/index";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const queryClient = createQueryClient();
const link = createOrpcLink(API_URL);
const client: AppRouterClient = createApiClient<AppRouterClient>(link);
export const orpc = createOrpc(client);
