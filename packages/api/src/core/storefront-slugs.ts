import { and, eq, ne } from "drizzle-orm";
import { db } from "@admin-template/db";
import { services } from "@admin-template/db/schema/business";

export function slugifyStorefrontServiceName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "service"
  );
}

export async function resolveUniqueServiceSlug(
  organizationId: string,
  name: string,
  excludeId?: string,
): Promise<string> {
  const base = slugifyStorefrontServiceName(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const conditions = [
      eq(services.organizationId, organizationId),
      eq(services.publicSlug, candidate),
    ];

    if (excludeId) {
      conditions.push(ne(services.id, excludeId));
    }

    const existing = await db.query.services.findFirst({
      where: and(...conditions),
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
