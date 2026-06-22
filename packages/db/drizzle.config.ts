import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from monorepo root (two levels up from packages/db)
config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
