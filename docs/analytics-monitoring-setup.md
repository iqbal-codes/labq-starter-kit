# Analytics & Monitoring Setup Guide

This project uses **PostHog** for product analytics and **Sentry** for error monitoring.

---

## PostHog (Product Analytics)

### Setup

1. Create a free account at [posthog.com](https://posthog.com)
2. Get your Project API Key from Settings → Project
3. Add to `apps/web/.env`:
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # or https://eu.i.posthog.com for EU
   ```

### Features Included

| Feature            | Description                                    |
| ------------------ | ---------------------------------------------- |
| **Event Tracking** | Automatic click, form submit, pageview capture |
| **Session Replay** | Record and watch user sessions                 |
| **Feature Flags**  | Gradual rollouts, A/B testing                  |
| **Funnels**        | Track user conversion flows                    |
| **Retention**      | Measure user retention over time               |

### Usage

```tsx
// Track custom events
import { trackEvent, identifyUser, isFeatureEnabled } from "@/lib/analytics";

// Track a button click
trackEvent("pricing_plan_selected", { plan: "pro", price: 49 });

// Identify user after login
identifyUser(user.id, { email: user.email, name: user.name });

// Check feature flag
if (isFeatureEnabled("new-dashboard")) {
	// Show new dashboard
}
```

### Pricing

- **Free tier:** 1M events/mo, 5K session recordings/mo
- **Pay-as-you-go** after that

---

## Sentry (Error Monitoring)

### Setup

1. Create a free account at [sentry.io](https://sentry.io)
2. Create a new project (select Next.js)
3. Get your DSN from Project Settings → Client Keys (DSN)
4. Add to `apps/web/.env`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
   ```
5. Add to `apps/server/.env`:
   ```env
   SENTRY_DSN=https://your-key@sentry.io/your-project-id
   ```

### Features Included

| Feature                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| **Error Tracking**         | Automatic exception capture with stack traces |
| **Performance Monitoring** | Trace slow API calls and queries              |
| **Session Replay**         | See what users did before an error            |
| **Source Maps**            | Debug minified production code                |
| **Alerts**                 | Get notified when error rates spike           |

### Usage

```tsx
// Capture errors manually
import { captureError, addBreadcrumb } from "@/lib/sentry";

try {
	await riskyOperation();
} catch (error) {
	captureError(error, {
		user: { id: user.id, email: user.email },
		tags: { feature: "checkout" },
		extra: { cartTotal: 99.99 },
	});
}

// Add breadcrumbs for debugging context
addBreadcrumb("checkout", "User clicked purchase button", { plan: "pro" });
```

### Pricing

- **Free tier:** 5K errors/mo, 50 replays/mo
- **Team:** $26/mo (50K errors, 500 replays)

---

## Environment Variables Summary

### `apps/web/.env`

```env
# Required
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# PostHog (optional but recommended)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Sentry (optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=
```

### `apps/server/.env`

```env
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars-long
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
GOOGLE_GENERATIVE_AI_API_KEY=

# Sentry (optional but recommended)
SENTRY_DSN=

# Environment
NODE_ENV=development
```

---

## How They Work Together

```
┌─────────────────────────────────────────────────────────┐
│                    Your SaaS App                         │
│                                                          │
│  User Action → Error occurs                              │
│       │                                                  │
│       ├──────► Sentry captures:                          │
│       │        - Error message & stack trace             │
│       │        - Session replay (before error)           │
│       │        - Breadcrumbs (user actions)              │
│       │        - Performance traces                      │
│       │                                                  │
│       └──────► PostHog tracks:                           │
│                - User behavior patterns                   │
│                - Funnel drop-offs                         │
│                - Feature flag exposure                    │
│                - Session replay (behavioral)              │
│                                                          │
│  Result: Know WHAT broke (Sentry) + WHY (PostHog)        │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

1. **Sign up** for both services (free tiers)
2. **Get your keys** from their dashboards
3. **Add to `.env`** files (see above)
4. **Restart dev server:** `bun dev`
5. **Generate some traffic** in your app
6. **Check dashboards:**
   - PostHog: Events, session replays, user paths
   - Sentry: Errors, performance, replays

---

## File Reference

| File                                           | Purpose                                    |
| ---------------------------------------------- | ------------------------------------------ |
| `apps/web/src/components/posthog-provider.tsx` | PostHog React provider & pageview tracking |
| `apps/web/src/lib/analytics.ts`                | PostHog utility functions                  |
| `apps/web/src/lib/sentry.ts`                   | Sentry utility functions                   |
| `apps/web/sentry.client.config.ts`             | Sentry client-side config                  |
| `apps/web/sentry.server.config.ts`             | Sentry server-side config                  |
| `apps/web/sentry.edge.config.ts`               | Sentry edge runtime config                 |
| `apps/web/src/app/global-error.tsx`            | Sentry global error boundary               |
| `apps/server/src/instrument.ts`                | Sentry server instrumentation              |
| `apps/server/src/sentry-utils.ts`              | Sentry server utilities                    |
