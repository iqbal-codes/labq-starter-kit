import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

export interface SessionContext {
  session: { user: { id: string; name: string; email: string } };
  activeOrganization: { id: string } | null;
  activeMember: { id: string; role: string } | null;
  permissions: string[];
}

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
      activeOrganization: context.activeOrganization ?? null,
      activeMember: context.activeMember ?? null,
      permissions: context.permissions ?? [],
    } satisfies SessionContext,
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

const requireOrganization = o.middleware(async ({ context, next }) => {
  const ctx = context as SessionContext;
  if (!ctx.activeOrganization) {
    throw new ORPCError("ORGANIZATION_REQUIRED");
  }
  return next({ context: ctx });
});

export const organizationProcedure = protectedProcedure.use(requireOrganization);
