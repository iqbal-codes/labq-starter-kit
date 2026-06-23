import type { RouterClient } from "@orpc/server";
import { publicProcedure } from "../index";
import { organizationRouter } from "./organization";
import { operationsRouter } from "./operations";
import { storefrontRouter } from "./storefront";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),

  organization: {
    getContext: organizationRouter.getContext,
    create: organizationRouter.create,
    updateProfile: organizationRouter.updateProfile,
  },

  operations: {
    summary: operationsRouter.summary,
    customers: operationsRouter.customers,
    services: operationsRouter.services,
    orders: operationsRouter.orders,
  },

  storefront: {
    services: storefrontRouter.services,
    categories: storefrontRouter.categories,
  },
};

export type AppRouterClient = RouterClient<typeof appRouter>;
