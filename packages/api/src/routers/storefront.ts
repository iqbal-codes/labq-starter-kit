import { and, count, desc, eq, isNull, isNotNull } from "drizzle-orm";
import { db } from "@admin-template/db";
import { services } from "@admin-template/db/schema/business";
import { organization } from "@admin-template/db/schema/auth";
import { z } from "zod";
import { publicProcedure } from "../index";
import { slugifyStorefrontServiceName } from "../core/storefront-slugs";

export interface StorefrontService {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  price: string | null;
  createdAt: string;
}

const storefrontServiceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  price: z.string().nullable(),
  createdAt: z.string(),
});

const storefrontListSchema = z.object({
  items: z.array(storefrontServiceSchema),
  total: z.number().int().nonnegative(),
});

const storefrontDetailSchema = z.object({
  service: storefrontServiceSchema.nullable(),
});

const storefrontCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      slug: z.string(),
      label: z.string(),
    }),
  ),
});

function toStorefrontService(row: typeof services.$inferSelect): StorefrontService {
  return {
    id: row.id,
    slug: row.publicSlug,
    name: row.name,
    category: row.category,
    description: row.description,
    price: row.price,
    createdAt: row.createdAt.toISOString(),
  };
}

const orgInput = z.object({ org: z.string().min(1) });
const slugInput = orgInput.extend({ slug: z.string().min(1) });
const listInput = orgInput.extend({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
const featuredInput = orgInput.extend({
  limit: z.coerce.number().int().min(1).max(20).optional().default(4),
});

async function resolveOrgId(slug: string): Promise<string | null> {
  const [org] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  return org?.id ?? null;
}

function activeServiceWhere(orgId: string) {
  return and(
    eq(services.organizationId, orgId),
    eq(services.status, "active"),
    isNull(services.deletedAt),
  );
}

export const storefrontRouter = {
  services: {
    list: publicProcedure
      .route({ method: "GET", path: "/storefront/services/list" })
      .input(listInput)
      .output(storefrontListSchema)
      .handler(async ({ input }) => {
        const orgId = await resolveOrgId(input.org);
        if (!orgId) {
          return { items: [], total: 0 };
        }

        const where = activeServiceWhere(orgId);
        const rows = await db
          .select()
          .from(services)
          .where(where)
          .orderBy(desc(services.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const [total] = await db.select({ value: count() }).from(services).where(where);

        return {
          items: rows.map((row) => toStorefrontService(row)),
          total: total?.value ?? 0,
        };
      }),

    detail: publicProcedure
      .route({ method: "GET", path: "/storefront/services/detail" })
      .input(slugInput)
      .output(storefrontDetailSchema)
      .handler(async ({ input }) => {
        const orgId = await resolveOrgId(input.org);
        if (!orgId) {
          return { service: null };
        }

        const row = await db.query.services.findFirst({
          where: and(activeServiceWhere(orgId), eq(services.publicSlug, input.slug)),
        });

        return { service: row ? toStorefrontService(row) : null };
      }),

    featured: publicProcedure
      .route({ method: "GET", path: "/storefront/services/featured" })
      .input(featuredInput)
      .output(z.array(storefrontServiceSchema))
      .handler(async ({ input }) => {
        const orgId = await resolveOrgId(input.org);
        if (!orgId) {
          return [];
        }

        const rows = await db
          .select()
          .from(services)
          .where(activeServiceWhere(orgId))
          .orderBy(desc(services.createdAt))
          .limit(input.limit);

        return rows.map((row) => toStorefrontService(row));
      }),
  },

  categories: publicProcedure
    .route({ method: "GET", path: "/storefront/categories" })
    .input(orgInput)
    .output(storefrontCategoriesSchema)
    .handler(async ({ input }) => {
      const orgId = await resolveOrgId(input.org);
      if (!orgId) {
        return { categories: [] };
      }

      const rows = await db
        .select({ category: services.category })
        .from(services)
        .where(and(activeServiceWhere(orgId), isNotNull(services.category)))
        .orderBy(desc(services.createdAt));

      const categories = Array.from(
        new Map(
          rows
            .map((row) => row.category?.trim())
            .filter((category): category is string => Boolean(category))
            .map((category) => [
              category,
              {
                slug: slugifyStorefrontServiceName(category),
                label: category,
              },
            ]),
        ).values(),
      );

      return { categories };
    }),
};
