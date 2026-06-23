import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../../");

config({ path: path.join(monorepoRoot, ".env") });

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    STOREFRONT_SITE_ORIGIN: z.url().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    S3_ENDPOINT: z.string().default("http://localhost:9000"),
    S3_REGION: z.string().default("us-east-1"),
    S3_ACCESS_KEY_ID: z.string().default("minioadmin"),
    S3_SECRET_ACCESS_KEY: z.string().default("minioadmin"),
    S3_BUCKET: z.string().default("admin-app-template-dev"),
    S3_FORCE_PATH_STYLE: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
    S3_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(26214400),
    S3_ALLOWED_MIME_TYPES: z
      .string()
      .default(
        "image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
    CONTACT_EMAIL: z.string().email().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
