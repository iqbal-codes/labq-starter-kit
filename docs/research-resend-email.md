# Resend Email Integration Research

## Overview

Resend is a modern email API built for developers, created by the same team behind React Email. It offers excellent developer experience with native TypeScript support and React Email integration.

## Key Features

### 1. **Developer Experience**

- Simple, intuitive API
- Native TypeScript support
- React Email integration (send React components as emails)
- Comprehensive SDK for Node.js

### 2. **Free Tier**

- **100 emails/day**
- **3,000 emails/month**
- No credit card required
- Perfect for development and small projects

### 3. **Production Features**

- Domain verification for deliverability
- Webhooks for email events (delivered, opened, clicked, etc.)
- Email templates for team collaboration
- Scheduling support
- Attachments support

## Setup Requirements

### Prerequisites

1. **Resend Account**: Sign up at https://resend.com
2. **API Key**: Generate at https://resend.com/api-keys
3. **Domain Verification** (for production): Add DNS records at https://resend.com/domains

### Installation

```bash
# In server package
bun add resend react-email
```

## Integration Architecture

### Environment Variables

Add to `packages/env/src/server.ts`:

```typescript
RESEND_API_KEY: z.string().min(1),
RESEND_FROM_EMAIL: z.string().email(),
```

### Recommended Structure

```
packages/
  email/
    package.json
    src/
      index.ts          # Email service exports
      client.ts         # Resend client initialization
      templates/
        welcome.tsx      # Welcome email template
        verify.tsx       # Email verification template
        reset-password.tsx  # Password reset template
```

## Implementation Plan

### Phase 1: Core Setup

1. Create `packages/email` package
2. Add Resend SDK dependency
3. Configure environment variables
4. Create Resend client wrapper

### Phase 2: Email Templates

1. Create base email layout component
2. Build welcome email template
3. Build email verification template
4. Build password reset template

### Phase 3: Integration

1. Integrate with Better Auth for:
   - Email verification
   - Password reset
   - Magic link authentication
2. Create email sending utilities
3. Add error handling and logging

### Phase 4: Testing & Monitoring

1. Test with Resend's preview mode
2. Set up webhook handlers for delivery tracking
3. Monitor email delivery metrics

## Code Examples

### Client Setup

```typescript
import { Resend } from "resend";
import { env } from "@admin-template/env/server";

export const resend = new Resend(env.RESEND_API_KEY);
```

### Sending Email

```typescript
import { resend } from "./client";
import { WelcomeEmail } from "./templates/welcome";

const { data, error } = await resend.emails.send({
	from: env.RESEND_FROM_EMAIL,
	to: ["user@example.com"],
	subject: "Welcome to our platform!",
	react: WelcomeEmail({ name: "User" }),
});

if (error) {
	console.error("Email send error:", error);
	throw error;
}
```

### React Email Template

```tsx
import { Html, Button, Text, Container } from "react-email";

interface WelcomeEmailProps {
	name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
	return (
		<Html lang="en">
			<Container>
				<Text>Welcome, {name}!</Text>
				<Button href="https://example.com/get-started">Get Started</Button>
			</Container>
		</Html>
	);
}
```

## Domain Verification (Production)

### DNS Records Required

1. **SPF Record**: `v=spf1 include:amazonses.com ~all`
2. **DKIM Record**: Provided by Resend dashboard
3. **DMARC Record**: `v=DMARC1; p=none; rua=mailto:dmarc@example.com`

### Benefits

- Improved deliverability
- Avoid spam folder
- Build sender reputation
- Enable advanced features

## Best Practices

1. **Use React Email**: Leverage the native integration for type-safe templates
2. **Template Variables**: Use TypeScript interfaces for template props
3. **Error Handling**: Always handle email sending errors gracefully
4. **Rate Limiting**: Respect free tier limits during development
5. **Testing**: Use Resend's test mode before production
6. **Logging**: Track email sends for debugging and analytics

## Comparison with Alternatives

| Feature        | Resend       | SendGrid  | Postmark  |
| -------------- | ------------ | --------- | --------- |
| Free Tier      | 100/day      | 100/day   | 100/month |
| React Email    | ✅ Native    | ❌ Manual | ❌ Manual |
| TypeScript     | ✅ Excellent | ✅ Good   | ✅ Good   |
| DX             | ⭐⭐⭐⭐⭐   | ⭐⭐⭐    | ⭐⭐⭐⭐  |
| Deliverability | Good         | Excellent | Excellent |

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Docs](https://react.email)
- [Resend API Reference](https://resend.com/api-reference)
- [Resend Node.js SDK](https://github.com/resend/resend-node)

## Next Steps

1. Create Resend account and get API key
2. Add environment variables to `.env`
3. Create `packages/email` package
4. Implement email templates
5. Integrate with Better Auth
6. Test email sending
7. Set up domain verification for production
