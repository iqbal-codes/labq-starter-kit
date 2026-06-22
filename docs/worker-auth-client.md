# Auth Client Update - Worker Report

**Task:** Update Better Auth client with organization plugin

**Date:** 2026-05-28

## Changes Made

Updated `/Users/efishery/Documents/workspace/projects/karir-fit/apps/web/src/lib/auth-client.ts`:

1. Imported `organizationClient` from `better-auth/client/plugins`
2. Added `organizationClient()` to the plugins array in `createAuthClient`
3. Exported named exports:
   - `useSession`
   - `signIn`
   - `signOut`
   - `signUp`
   - `useActiveOrganization`
   - `useListOrganizations`

## Updated File Content

```typescript
import { env } from "@labq-modules/env/web";
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
	plugins: [organizationClient()],
});

export const { useSession, signIn, signOut, signUp, useActiveOrganization, useListOrganizations } =
	authClient;
```

## Validation

- ✓ File updated successfully
- ✓ Uses existing baseURL config (`env.NEXT_PUBLIC_SERVER_URL`)
- ✓ Imports organization client plugin from correct path
- ✓ Destructures and exports all required named exports

## Open Risks

- None identified

## Recommended Next Step

Verify the TypeScript compilation passes and check if server-side auth config also needs the organization plugin.
