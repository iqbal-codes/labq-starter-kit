import { z } from "zod";

const schema = z.object({
  VITE_API_URL: z.string().min(1).default("http://localhost:4000"),
});

export const env = schema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});
