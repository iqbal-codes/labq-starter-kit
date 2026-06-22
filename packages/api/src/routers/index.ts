import type { RouterClient } from "@orpc/server";
import { publicProcedure } from "../index";
import { organizationRouter } from "./organization";
import { crmRouter } from "./crm";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),

  organization: {
    getContext: organizationRouter.getContext,
    create: organizationRouter.create,
    updateProfile: organizationRouter.updateProfile,
  },

  crm: {
    summary: crmRouter.summary,
    leads: crmRouter.leads,
    contacts: crmRouter.contacts,
    companies: crmRouter.companies,
    stages: crmRouter.stages,
    deals: crmRouter.deals,
    activities: crmRouter.activities,
  },

};

export type AppRouterClient = RouterClient<typeof appRouter>;
