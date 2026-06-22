# UI Rules

1. Prefer `@admin-template/ui` primitives and compose from them instead of styling one-off controls from scratch.
2. No hardcoded colors — use semantic classes backed by the shared CSS variable tokens.
3. No raw Tailwind palette classes (`bg-red-500`, `bg-zinc-100`, etc.).
4. Responsive behavior should use Tailwind responsive prefixes, not separate markup trees.
5. Forms use the TanStack Form patterns from `@admin-template/ui/components/forms/tanstack-form`.
6. Data tables use TanStack Table + `nuqs` URL state + the shared DataTable helpers.
7. Column filters should come from `columnDef.meta.variant` and the shared filter components (`text`, `select`, `date`, `slider`).
8. Toast notifications use `sonner`.
9. Create/edit flows use `Dialog`; destructive confirmations use `AlertDialog`.
10. Empty states should use `@admin-template/ui/components/empty` when a reusable no-data presentation is needed.
