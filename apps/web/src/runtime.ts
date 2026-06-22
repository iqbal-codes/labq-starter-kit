import {
  createQueryClient,
  createOrpcLink,
  createApiClient,
  createOrpc,
} from "@admin-template/api-client";
import type { AppRouterClient } from "@admin-template/api/routers/index";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const queryClient = createQueryClient();
const link = createOrpcLink(API_URL);
const client: AppRouterClient = createApiClient<AppRouterClient>(link);
export const orpc = createOrpc(client);
