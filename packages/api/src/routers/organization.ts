import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { randomUUID } from "node:crypto";
import { db } from "@labq-modules/db";
import { organizationSettings } from "@labq-modules/db/schema/business";
import { organization as orgTable, member } from "@labq-modules/db/schema/auth";
import { organizationProcedure, protectedProcedure } from "../index";
import { createOrganizationSchema } from "@labq-modules/schemas";
import { insertInitialWorkspaceTables } from "@labq-modules/auth/seed";

// ── Slug generation ────────────────────────────────────────────

export function slugifyOrganizationName(name: string): string {
  const slug = name
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "organization";
}

async function resolveUniqueOrganizationSlug(baseSlug: string): Promise<string> {
  const candidate = baseSlug;
  const [existing] = await db
    .select({ id: orgTable.id })
    .from(orgTable)
    .where(eq(orgTable.slug, candidate))
    .limit(1);
  if (!existing) return candidate;

  for (let suffix = 2; suffix <= 100; suffix++) {
    const next = `${baseSlug}-${suffix}`;
    const [taken] = await db
      .select({ id: orgTable.id })
      .from(orgTable)
      .where(eq(orgTable.slug, next))
      .limit(1);
    if (!taken) return next;
  }

  throw new ORPCError("VALIDATION_ERROR", {
    message: "Organization slug is not available",
  });
}

// ── Router ─────────────────────────────────────────────────────

export const organizationRouter = {
  getContext: protectedProcedure.handler(async ({ context }) => {
    const orgId = context.activeOrganization?.id;
    if (!orgId) return { organization: null };

    const [org] = await db.select().from(orgTable).where(eq(orgTable.id, orgId)).limit(1);

    const settings = await db.query.organizationSettings.findFirst({
      where: eq(organizationSettings.organizationId, orgId),
    });

    return {
      organization: {
        id: orgId,
        name: org?.name ?? null,
        currency: settings?.currency ?? "IDR",
        permissions: context.permissions,
      },
    };
  }),

  create: protectedProcedure.input(createOrganizationSchema).handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const name = input.name.trim();
    const organizationId = randomUUID();
    const memberId = randomUUID();
    const timestamp = new Date();
    const slug = await resolveUniqueOrganizationSlug(slugifyOrganizationName(name));

    await db.transaction(async (tx) => {
      await tx.insert(orgTable).values({
        id: organizationId,
        name,
        slug,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      await tx.insert(member).values({
        id: memberId,
        organizationId,
        userId,
        role: "owner",
        createdAt: timestamp,
      });

      await insertInitialWorkspaceTables(tx, organizationId, userId, timestamp);
    });

    return { organization: { id: organizationId, name, slug } };
  }),

  updateProfile: organizationProcedure.input(createOrganizationSchema).handler(async ({ context, input }) => {
    const orgId = context.activeOrganization?.id;
    if (!orgId) throw new ORPCError("ORGANIZATION_REQUIRED");

    const { name } = input;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ORPCError("VALIDATION_ERROR", { message: "Name is required" });
    }

    await db.update(orgTable).set({ name: name.trim() }).where(eq(orgTable.id, orgId));

    return { success: true };
  }),
};
