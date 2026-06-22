# UI Tokens

All UI styling comes from `@labq-modules/ui`, with the token source defined in `packages/ui/src/styles/globals.css`.

## Color System

- Semantic colors are CSS variables authored in OKLCH (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`)
- Sidebar-specific tokens exist alongside the base palette (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`)
- Chart tokens (`--chart-1` through `--chart-5`) are available for dashboard-style data visuals
- Feature code should consume semantic classes such as `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, and `bg-sidebar`

## Typography

- Font: Inter Variable (via `@fontsource-variable/inter`)
- `--font-sans` and `--font-heading` both resolve to Inter today
- Page titles commonly use `PageHeader` (`text-2xl`, bold); supporting copy typically uses `text-sm text-muted-foreground`

## Spacing

- Standard page padding: `p-6`
- Standard vertical rhythm: `gap-4`, `space-y-4`, `space-y-6`
- Table cards usually keep outer chrome thin (`p-0` on the card, content spacing handled inside the table pattern)

## Radius Scale

- Base radius token: `--radius: 0.625rem`
- Derived radii: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-3xl`, `--radius-4xl`

## Components

Use `@labq-modules/ui` primitives and semantic classes rather than raw palette utilities or hardcoded color values.
