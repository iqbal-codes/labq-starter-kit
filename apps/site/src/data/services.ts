export interface Service {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  categorySlug: string;
  priceCents: number | null;
  durationMinutes: number;
  durationLabel: string;
  imageUrl: string;
  featured: boolean;
  content: string;
  relatedSlugs: string[];
}

export const categories = [
  { slug: "consulting", label: "Consulting" },
  { slug: "analytics", label: "Analytics" },
  { slug: "strategy", label: "Strategy" },
  { slug: "engineering", label: "Engineering" },
  { slug: "design", label: "Design" },
] as const;

export const services: Service[] = [
  {
    slug: "data-consulting",
    title: "Data Consulting",
    subtitle: "Turn raw data into strategic clarity",
    description:
      "Turn raw data into strategic clarity with expert analysis and actionable recommendations.",
    category: "Consulting",
    categorySlug: "consulting",
    priceCents: 250_000,
    durationMinutes: 180,
    durationLabel: "2–4 weeks",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=700&fit=crop",
    featured: true,
    content: `We help organizations make sense of their data landscape. Our consulting engagement includes a thorough audit of your data infrastructure, identification of key insights, and a clear roadmap for action.

## What's Included

- **Data audit** — inventory of sources, quality assessment, and gap analysis
- **Insight mapping** — key metrics and KPIs tied to business outcomes
- **Action plan** — prioritized recommendations with clear next steps
- **Follow-up** — 30-day check-in to track progress and adjust

## Who It's For

Teams that have data but lack clarity on what it means or how to act on it.`,
    relatedSlugs: ["analytics-dashboard", "growth-strategy"],
  },
  {
    slug: "analytics-dashboard",
    title: "Analytics Dashboard",
    subtitle: "Dashboards built around the questions your team asks",
    description: "Custom dashboards that surface the metrics that matter, updated in real time.",
    category: "Analytics",
    categorySlug: "analytics",
    priceCents: 500_000,
    durationMinutes: 240,
    durationLabel: "3–6 weeks",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=700&fit=crop",
    featured: true,
    content: `We design and build custom analytics dashboards tailored to your business. No cookie-cutter templates — every dashboard is built around the questions your team actually asks.

## What's Included

- **Discovery session** — understand your metrics, workflows, and decision points
- **Dashboard design** — layout, visualizations, and interaction patterns
- **Data pipeline** — connect your sources and automate refreshes
- **Training** — handoff session so your team owns the dashboard

## Who It's For

Leaders and operators who need real-time visibility into performance.`,
    relatedSlugs: ["data-consulting", "platform-engineering"],
  },
  {
    slug: "growth-strategy",
    title: "Growth Strategy",
    subtitle: "Roadmaps designed to scale sustainably",
    description: "Data-driven roadmaps designed to scale your business sustainably.",
    category: "Strategy",
    categorySlug: "strategy",
    priceCents: 800_000,
    durationMinutes: 300,
    durationLabel: "4–8 weeks",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=700&fit=crop",
    featured: true,
    content: `We work with leadership teams to develop growth strategies grounded in data, not gut feel. Our approach combines market analysis, customer research, and operational audit to produce a roadmap you can actually execute.

## What's Included

- **Market analysis** — sizing, segmentation, and competitive landscape
- **Customer research** — interviews, surveys, and behavioral data review
- **Growth model** — revenue projections with levers and assumptions
- **Execution plan** — phased roadmap with milestones and ownership

## Who It's For

Founders and executives navigating growth inflection points.`,
    relatedSlugs: ["data-consulting", "product-design"],
  },
  {
    slug: "platform-engineering",
    title: "Platform Engineering",
    subtitle: "Reliable infrastructure for ambitious teams",
    description: "Build reliable, scalable infrastructure that grows with your team.",
    category: "Engineering",
    categorySlug: "engineering",
    priceCents: 1_000_000,
    durationMinutes: 420,
    durationLabel: "6–12 weeks",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=700&fit=crop",
    featured: true,
    content: `We design and build platform infrastructure that your engineering team can ship on with confidence. From CI/CD pipelines to monitoring, we focus on reliability and developer experience.

## What's Included

- **Architecture review** — assess current state and identify failure modes
- **Infrastructure design** — cloud-native patterns, IaC, and observability
- **Implementation** — hands-on build with your team
- **Documentation** — runbooks, architecture diagrams, and onboarding guides

## Who It's For

Engineering teams that need infrastructure to match their ambition.`,
    relatedSlugs: ["analytics-dashboard", "process-optimization"],
  },
  {
    slug: "product-design",
    title: "Product Design",
    subtitle: "Design that converts, from research to polish",
    description: "User-centered design that converts — from research through polished UI.",
    category: "Design",
    categorySlug: "design",
    priceCents: 600_000,
    durationMinutes: 300,
    durationLabel: "4–8 weeks",
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=700&fit=crop",
    featured: false,
    content: `We design digital products people actually want to use. Our process moves from research to prototype to polished UI, with user validation at every step.

## What's Included

- **User research** — interviews, competitive audit, and persona development
- **Information architecture** — navigation, flow diagrams, and content strategy
- **UI design** — component library, responsive layouts, and design tokens
- **Handoff** — specs, assets, and developer collaboration

## Who It's For

Teams launching new products or redesigning existing ones.`,
    relatedSlugs: ["growth-strategy", "platform-engineering"],
  },
  {
    slug: "process-optimization",
    title: "Process Optimization",
    subtitle: "Remove friction from your operating system",
    description: "Streamline operations and eliminate bottlenecks across your workflow.",
    category: "Consulting",
    categorySlug: "consulting",
    priceCents: 350_000,
    durationMinutes: 180,
    durationLabel: "2–6 weeks",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=700&fit=crop",
    featured: false,
    content: `We map your current workflows, identify friction, and design streamlined processes that save time and reduce errors.

## What's Included

- **Process audit** — full mapping of current workflows and handoffs
- **Bottleneck analysis** — data-driven identification of constraints
- **Redesign** — optimized processes with clear ownership and SLAs
- **Change management** — rollout plan and team training

## Who It's For

Operations teams feeling the drag of manual or fragmented workflows.`,
    relatedSlugs: ["data-consulting", "analytics-dashboard"],
  },
];

export function getFeaturedServices(limit = 4): Service[] {
  return services.filter((service) => service.featured).slice(0, limit);
}

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export function getServicesByCategory(categorySlug: string): Service[] {
  return services.filter((service) => service.categorySlug === categorySlug);
}

export function getRelatedServices(service: Service): Service[] {
  return service.relatedSlugs
    .map((slug) => getServiceBySlug(slug))
    .filter((candidate): candidate is Service => candidate !== undefined);
}
