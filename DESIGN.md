---
name: LabQ Modules
description: Modular internal tools platform — clean, capable, calm
colors:
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  accent-foreground: "oklch(0.205 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  sidebar: "oklch(0.985 0 0)"
  sidebar-foreground: "oklch(0.145 0 0)"
typography:
  body:
    fontFamily: "Inter Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  display:
    fontFamily: "Inter Variable, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.2
  label:
    fontFamily: "Inter Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  "2xl": "18px"
  "3xl": "22px"
  "4xl": "26px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.4xl}"
    padding: "8px 12px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.4xl}"
    padding: "8px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.4xl}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.4xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.3xl}"
    padding: "8px 12px"
---

# Design System: LabQ Modules

## 1. Overview

**Creative North Star: "The Quiet Workshop"**

A focused workspace where tools are precise, surfaces are clean, and nothing competes for attention. The interface recedes — it's a well-organized workbench where every tool has its place, every surface is purposeful, and the work itself is what fills the room.

The system is built on radical neutrality: pure grays with zero chromatic tint, creating a canvas where data and content carry all the visual weight. The absence of a brand accent color is deliberate — it prevents any single element from screaming for attention and keeps the hierarchy earned through typography, spacing, and density. When color appears, it's functional: destructive red for errors, green for success. Everything else is the quiet confidence of a monochrome palette used with precision.

This system explicitly rejects: SaaS dashboard clichés (hero-metric cards, gradient text, purple-blue gradients), enterprise chrome (dense toolbars, gray-on-gray tedium, Windows-style UI), and over-designed surfaces (glassmorphism, neon accents, trend-chasing effects). The personality is _clean, capable, calm_ — restraint as a design principle, not a limitation.

**Key Characteristics:**

- Pure neutral monochrome palette — no brand accent, no tinted grays
- Flat elevation through tonal layering — depth via background shifts and borders, not shadows
- Pill-shaped buttons with tactile press states — physical precision in every interaction
- Generous whitespace with tight data density where it matters
- Single typeface (Inter Variable) used across all roles — consistency over variety

## 2. Colors

The palette is a pure achromatic ramp — every neutral carries zero chroma, creating a system where the only color that exists is the color you put into it.

### Primary

- **Near-Black** (oklch(0.205 0 0)): Primary buttons, active navigation, headings, high-emphasis text. The darkest functional tone — used when something needs to command attention without color.
- **Near-White** (oklch(0.985 0 0)): Primary button text, foreground on dark surfaces. Inverted role of the near-black.

### Neutral

- **Pure White** (oklch(1 0 0)): Page background, card backgrounds, popover surfaces. The canvas.
- **Cloud** (oklch(0.97 0 0)): Secondary buttons, hover backgrounds, muted surface fills, accent containers. The workhorse neutral — sits between pure white and the border tone, creating subtle depth without shadows. Also used for secondary, muted, and accent surface roles (all share this value by design — no secondary accent exists).
- **Ink** (oklch(0.145 0 0)): Body text, primary foreground, card text. Near-black with enough warmth to avoid the harshness of pure #000.
- **Mist** (oklch(0.556 0 0)): Muted text, descriptions, placeholder text, secondary labels. Mid-gray that reads clearly against both white and cloud backgrounds.
- **Silver** (oklch(0.922 0 0)): Borders, input backgrounds, dividers. Light enough to be structural without being decorative.
- **Slate** (oklch(0.708 0 0)): Focus rings, active indicators. Mid-light gray for interactive state feedback.

### Functional

- **Destructive** (oklch(0.577 0.245 27.325)): Error states, delete actions, destructive buttons. The only chromatic color in the light palette — a warm red at moderate saturation, used sparingly so its appearance always means something.

### Dark Mode

The system has full dark mode support via the `.dark` class. Dark mode inverts the tonal hierarchy: background becomes near-black (oklch(0.145 0 0)), foreground becomes near-white (oklch(0.985 0 0)), and borders become white at 10% opacity. Destructive shifts lighter (oklch(0.704 0.191 22.216)) for visibility against dark surfaces. All other roles swap to their dark counterparts. The monochrome rule holds — no chromatic tint is introduced in dark mode.

### Named Rules

**The Monochrome Rule.** Every neutral in the system is chroma 0. No tinted grays, no warm beiges, no cool slates. The canvas is achromatic so that data, status indicators, and user content carry all the visual weight. The moment a gray picks up a hue, it's no longer a neutral — it's a color with a job, and that job must be justified.

**The Functional Color Rule.** Chromatic color appears only for functional purposes: destructive red for errors and deletions, green (when needed) for success states. No decorative accent color. If you're reaching for a brand purple or a highlight blue, stop — the system's identity is its restraint.

**The Achromatic Canvas Rule.** The page background is pure white (oklch(1 0 0)) or cloud (oklch(0.97 0 0)). Never tint it toward warm (cream, sand, beige) or cool (blue-gray, slate). Warmth in the brand is carried by content, imagery, and context — not by the canvas color.

## 3. Typography

**Display Font:** Inter Variable (with system-ui, sans-serif fallback)
**Body Font:** Inter Variable (with system-ui, sans-serif fallback)
**Label Font:** Inter Variable (with system-ui, sans-serif fallback)

**Character:** A single typeface used in multiple weights, not two families paired on a contrast axis. Inter Variable's optical size axis and wide character set make it work across every role from 11px labels to 30px headings. The personality is technical precision — legible at small sizes, confident at large sizes, never decorative.

### Hierarchy

- **Display** (700, clamp(1.5rem, 2vw, 1.875rem), 1.2): Page titles, welcome messages. Used sparingly — one per screen maximum.
- **Title** (600, 1rem, 1.4): Card titles, section headers, modal titles. The workhorse heading.
- **Body** (400, 0.875rem, 1.5): Primary content, descriptions, form labels. Max line length 65–75ch for readability.
- **Label** (500, 0.875rem, 1.5): Buttons, input text, navigation items, badge text. Slightly heavier than body for interactive elements.
- **Caption** (400, 0.75rem, 1.4): Timestamps, metadata, secondary information. Muted foreground color.

### Named Rules

**The Single Voice Rule.** One typeface, multiple weights. No serif-sans pairing, no display font for headings, no monospace for data. Inter Variable's weight range (100–900) and optical size axis provide enough contrast through weight and size alone. This keeps the system legible and fast — no font loading surprises, no unexpected weight shifts.

## 4. Elevation

Flat with tonal layering. No box-shadows as a permanent surface property. Depth is conveyed through background color shifts and subtle borders: the page is white, cards are white with a 1px ring at 5% foreground opacity, sidebars are cloud-toned, and hover states darken or lighten the surface by one step. Shadows appear only as transient feedback — a brief `shadow-md` on card hover, a focus ring on interactive elements — and vanish when the interaction ends.

**Implementation note:** The current Card component applies `shadow-md` as a permanent base class. This contradicts the flat-by-default intent. When touching card styling, remove the permanent `shadow-md` and apply it only on `:hover` to match the design system. The ring border (`ring-1 ring-foreground/5`) provides sufficient structural definition at rest.

### Shadow Vocabulary

- **Hover feedback** (`shadow-md`): Brief appearance on card hover, providing tactile confirmation of interactivity. Disappears on mouse leave. Should NOT be a permanent property.
- **Focus ring** (`ring-3 ring-ring/30`): A 3px ring at 30% opacity around focused inputs and buttons. Structural, not decorative. Always visible on keyboard focus.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. The page background, cards, inputs, and sidebars are differentiated only by background color and border. Shadows are a response to state (hover, focus, active), not a permanent property of a surface. If a card always has a shadow, the shadow is wrong.

## 5. Components

### Buttons

Pill-shaped and tactile. Every button uses `rounded-4xl` (26px radius) for a distinctive capsule form that reads as interactive without being playful.

- **Shape:** Fully rounded pill (rounded-4xl, 26px radius)
- **Primary:** Near-black background (oklch(0.205 0 0)), near-white text. Height 36px, horizontal padding 12px, gap 6px between icon and label. Hover: 80% opacity. Press: 1px translateY downward for tactile feedback.
- **Outline:** Transparent background with silver border. Hover: cloud background. The default secondary action.
- **Ghost:** No background, no border. Hover: cloud background. Used in toolbars, table rows, navigation.
- **Destructive:** Translucent destructive red background (10% opacity), destructive red text. Hover: 20% opacity. Never a solid red button — the translucency signals severity without overwhelming.
- **Sizes:** xs (24px), sm (32px), default (36px), lg (40px). Icon-only sizes match: icon-xs, icon-sm, default icon (36px), icon-lg (40px).
- **Loading:** Spinner replaces content (default) or sits left/right. Disabled state during load.
- **Focus:** 3px ring at ring color 30% opacity. Visible on keyboard focus, hidden on mouse click.

### Cards

Structural containers that hold content without decoration.

- **Corner Style:** Fully rounded (rounded-4xl, 26px radius)
- **Background:** Card white (oklch(1 0 0))
- **Shadow Strategy:** Flat at rest. Transient `shadow-md` on hover only. (See Elevation note — current code applies shadow permanently; this is a known deviation.)
- **Border:** 1px ring at 5% foreground opacity (light mode) / 10% (dark mode) — subtle structural edge
- **Internal Padding:** 24px (default) / 16px (compact `size="sm"`)
- **Header:** Grid layout with auto-rows, supports action slot in top-right corner

### Inputs

Clean, focused, minimal chrome.

- **Style:** Cloud background (input color at 50% opacity), transparent border, pill-shaped (rounded-3xl, 22px radius). Height 36px.
- **Focus:** 3px ring at ring color 30% opacity — visible, structural, not decorative
- **Error:** Destructive border + ring at 20% opacity
- **Placeholder:** Muted foreground color (oklch(0.556 0 0)) — must meet 4.5:1 contrast against input background
- **Disabled:** 50% opacity, pointer-events none

### Badges

Compact status and label indicators.

- **Shape:** Pill (rounded-3xl, 22px radius), height 20px, horizontal padding 8px
- **Default:** Near-black background, near-white text — for primary status
- **Secondary:** Cloud background, near-black text — for neutral labels
- **Destructive:** Translucent destructive red (10% opacity), destructive red text — for error/delete status
- **Outline:** Transparent background with silver border, ink text — for informational tags
- **Ghost:** No background, hover shows cloud — for interactive/filter tags

### Navigation (Sidebar)

The structural backbone of the application.

- **Width:** 16rem expanded / 3rem collapsed (icon mode) / 18rem on mobile (sheet overlay)
- **Background:** Sidebar surface (oklch(0.985 0 0)) — one step darker than page white
- **Items:** Ghost-style with rounded corners, active state uses muted background
- **Typography:** Label weight (500) for nav items, caption size for section headers
- **Collapse:** Keyboard shortcut Ctrl+B, animated width transition
- **Mobile:** Sheet overlay with backdrop, full 18rem width

### DataTable

Information-dense tables with server-side pagination.

- **Toolbar:** Search input + faceted filters + view options toggle
- **Headers:** Column sort indicators, resize handles
- **Rows:** Hover state with cloud background, selectable rows
- **Pagination:** Page size selector, page numbers, previous/next
- **Skeleton:** Loading state mirrors row structure

### Dialog / Modal

Overlay containers for focused tasks.

- **Overlay:** Dark backdrop with blur
- **Shape:** Rounded corners matching card radius
- **Structure:** Header with title + description, content area, footer with actions
- **Close:** X button in top-right, Escape key support

## 6. Do's and Don'ts

### Do:

- **Do** use the monochrome palette as the default. Every neutral is chroma 0 — no tinted grays, no warm beiges. The canvas is achromatic.
- **Do** differentiate surfaces through background color shifts and ring borders, not shadows. White → cloud → sidebar creates clear hierarchy without elevation tricks.
- **Do** use pill-shaped buttons (rounded-4xl) for all primary and secondary actions. The capsule form is the system's signature interactive shape.
- **Do** keep focus states visible and structural: 3px ring at 30% opacity. Keyboard navigation must work everywhere.
- **Do** use `text-wrap: balance` on h1–h3 for even line lengths. Cap body text at 65–75ch.
- **Do** apply `prefers-reduced-motion: reduce` to every animation. Crossfade or instant transition as the alternative.
- **Do** place destructive actions in ghost or translucent-destructive style, never as the visual default. Severity is communicated through restraint, not red overload.
- **Do** ease motion with exponential curves (ease-out-quart: `cubic-bezier(0.16, 1, 0.3, 1)`). Keep transitions under 300ms. Use transform and opacity — never animate layout properties.

### Don't:

- **Don't** use hero-metric cards with big numbers, small labels, and gradient accents. This is the SaaS dashboard cliché that PRODUCT.md explicitly bans. If the card shows one big number with a small label underneath and a gradient accent stripe, it's the template — rewrite it.
- **Don't** add gradient text (`background-clip: text` with gradients). Decorative, never meaningful. Use a single solid color.
- **Don't** use glassmorphism, backdrop-blur cards, or decorative glass effects as a default surface treatment. Rare and purposeful, or nothing.
- **Don't** use numbered section markers (01 / 02 / 03) as scaffolding above every section. Numbers earn their place only when the content is genuinely sequential.
- **Don't** add tiny uppercase tracked eyebrows ("ABOUT", "PROCESS", "PRICING") above every section heading. One kicker as a deliberate brand system is voice; eyebrows everywhere are AI grammar.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, callouts, or alerts. Rewrite with full borders, background tints, leading numbers/icons, or nothing.
- **Don't** pair Inter with another geometric sans-serif for display text. The system uses one typeface — Inter Variable — in multiple weights. No serif-sans pairing, no display font.
- **Don't** use shadows as a permanent surface property. Shadows appear on hover/focus only and vanish when the interaction ends. A card that always has a shadow is a card that's always elevated — and if everything is elevated, nothing is.
- **Don't** use warm-tinted backgrounds (cream, sand, beige, parchment). The background is pure white (oklch(1 0 0)) or cloud (oklch(0.97 0 0)). Warmth is carried by content, not the canvas.
- **Don't** animate layout properties (width, height, flex, grid) unless truly needed. Use transform and opacity for motion.
- **Don't** use bounce, elastic, or spring easing curves. Ease out with exponential curves. If the element wobbles on arrival, the easing is wrong.
