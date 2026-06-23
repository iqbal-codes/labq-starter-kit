ALTER TABLE "services" ADD COLUMN "public_slug" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "category" text;--> statement-breakpoint
WITH normalized AS (
  SELECT
    "id",
    "organization_id",
    COALESCE(
      NULLIF(
        trim(BOTH '-' FROM regexp_replace(lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')),
        ''
      ),
      'service'
    ) AS "base_slug",
    row_number() OVER (
      PARTITION BY
        "organization_id",
        COALESCE(
          NULLIF(
            trim(BOTH '-' FROM regexp_replace(lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')),
            ''
          ),
          'service'
        )
      ORDER BY "created_at", "id"
    ) AS "slug_rank"
  FROM "services"
),
backfilled AS (
  SELECT
    "id",
    CASE
      WHEN "slug_rank" = 1 THEN "base_slug"
      ELSE "base_slug" || '-' || "slug_rank"
    END AS "public_slug"
  FROM normalized
)
UPDATE "services"
SET "public_slug" = backfilled."public_slug"
FROM backfilled
WHERE "services"."id" = backfilled."id";--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "public_slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_org_slug_key" UNIQUE("organization_id","public_slug");
