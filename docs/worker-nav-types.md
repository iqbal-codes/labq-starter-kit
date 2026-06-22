# Navigation Types and Configuration - Implementation Report

## Task

Create navigation types and config for the dashboard at `/apps/web/src/`

## Files Created

### 1. `src/types/index.ts`

- `PermissionCheck` interface: permission, plan, feature, role, requireOrg
- `NavItem` interface: title, url, disabled, external, shortcut, icon, label, description, isActive, items, access
- `NavGroup` interface: label, items

### 2. `src/config/nav-config.ts`

Navigation configuration with 3 groups:

**Overview:**

- Dashboard (/dashboard/overview) - LayoutDashboard icon
- Workspaces (/dashboard/workspaces) - Briefcase icon
- Teams (/dashboard/workspaces/team) - Users icon, requireOrg: true
- Product (/dashboard/product) - Package icon
- Users (/dashboard/users) - UserCog icon
- Kanban (/dashboard/kanban) - Kanban icon
- Chat (/dashboard/chat) - MessageSquare icon

**Elements:**

- Forms (/dashboard/forms) - FileText icon, collapsible with Basic/Multi-Step/Sheet/Advanced sub-items
- React Query (/dashboard/react-query) - Database icon
- Icons (/dashboard/elements/icons) - Smile icon

**Account:**

- Pro (/dashboard/pro) - Sparkles icon, collapsible with Exclusive sub-item
- Account (/dashboard/account) - Settings icon, collapsible with Profile, Notifications, Billing (requireOrg), Login

### 3. `src/hooks/use-nav.ts`

RBAC navigation filtering hooks:

- `useFilteredNavItems(items, activeOrgRole?)` - filters items based on access.requireOrg and access.role
- `useFilteredNavGroups(groups, activeOrgRole?)` - wraps filtering for groups

Uses `useSession` and `useActiveOrganization` from `@/lib/auth-client`.

## Validation

- All 3 files written successfully
- Proper TypeScript types defined
- React hooks rules followed (no hooks called inside loops)
- String icon names used for lucide-react compatibility

## Implementation Date

2026-05-28
