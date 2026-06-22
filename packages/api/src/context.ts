import { auth } from "@labq-modules/auth";
import { getPermissionsForRole } from "@labq-modules/types";
import { db } from "@labq-modules/db";
import { member as memberTable } from "@labq-modules/db/schema/auth";
import { eq, and } from "drizzle-orm";
import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
  context: HonoContext;
}

export interface Context {
  session: { user: { id: string; name: string; email: string } } | null;
  activeOrganization: { id: string } | null;
  activeMember: { id: string; role: string } | null;
  permissions: string[];
}

export async function createContext({ context }: CreateContextOptions): Promise<Context> {
  // Build fresh Headers — @hono/node-server's raw headers may not be a proper
  // Web Headers instance that Better Auth can parse cookies from.
  const headers = new Headers();
  for (const [key, value] of context.req.raw.headers.entries()) {
    headers.append(key, value);
  }

  const sessionResult = await auth.api.getSession({ headers });

  if (!sessionResult?.user) {
    return { session: null, activeOrganization: null, activeMember: null, permissions: [] };
  }

  const sessionData = sessionResult as Record<string, unknown>;
  const sessionObj = sessionData.session as Record<string, unknown> | undefined;
  const activeOrganizationId = sessionObj?.activeOrganizationId as string | undefined;

  let activeOrganization: { id: string } | null = null;
  let activeMember: { id: string; role: string } | null = null;

  if (activeOrganizationId) {
    activeOrganization = { id: activeOrganizationId };

    // Resolve the member record for role/permissions
    const [member] = await db
      .select()
      .from(memberTable)
      .where(
        and(
          eq(memberTable.organizationId, activeOrganizationId),
          eq(memberTable.userId, sessionResult.user.id),
        ),
      )
      .limit(1);

    if (member) {
      activeMember = { id: member.id, role: member.role };
    }
  }

  return {
    session: {
      user: {
        id: sessionResult.user.id,
        name: sessionResult.user.name,
        email: sessionResult.user.email,
      },
    },
    activeOrganization,
    activeMember,
    permissions: activeMember ? [...getPermissionsForRole(activeMember.role)] : [],
  };
}
