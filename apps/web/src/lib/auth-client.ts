import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

// Route through the Vite proxy so the browser doesn't hit CORS/cookie issues.
// The Vite dev server proxies /api/* to the API server on port 4000.
const API_URL = import.meta.env.VITE_API_URL || "";

// Cast to any to prevent TS2883 declaration portability issues with better-auth inferred types in composite build
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [organizationClient()],
}) as any;
