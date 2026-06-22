# Better Auth Server Configuration Update

## Task Completed

Updated `/Users/efishery/Documents/workspace/projects/karir-fit/packages/auth/src/index.ts` with the following changes:

### Imports Added

- `organization` from `better-auth/plugins`
- `nextCookies` from `better-auth/next-js`

### Plugins Array Updated

Added two plugins:

- `nextCookies()` - for Next.js cookie handling
- `organization({ teams: { enabled: true } })` - for organization/team features

### Social Providers Added

```typescript
socialProviders: {
  github: {
    clientId: env.GITHUB_CLIENT_ID ?? "",
    clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
  },
},
```

## Open Risks/Questions

**Environment Variables Missing:**
The `packages/env/src/server.ts` file needs to be updated to include:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

These env vars are referenced with empty string fallbacks but are not yet defined in the env schema.

## Recommended Next Step

Update `packages/env/src/server.ts` to add the OAuth client ID/secret env vars:

```typescript
GITHUB_CLIENT_ID: z.string().optional(),
GITHUB_CLIENT_SECRET: z.string().optional(),
GOOGLE_CLIENT_ID: z.string().optional(),
GOOGLE_CLIENT_SECRET: z.string().optional(),
```

## Final File Content

```typescript
import { createDb } from "@admin-template/db";
import * as schema from "@admin-template/db/schema/auth";
import { env } from "@admin-template/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",

			schema: schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [nextCookies(), organization({ teams: { enabled: true } })],
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID ?? "",
				clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
			},
			google: {
				clientId: env.GOOGLE_CLIENT_ID ?? "",
				clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
			},
		},
	});
}

export const auth = createAuth();
```
