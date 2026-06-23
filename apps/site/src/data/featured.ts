import { getFeaturedServices, type Service } from "./services";

export interface FeaturedItem {
  service: Service;
  tag?: string;
  accent?: "default" | "muted";
}

export function getFeaturedItems(): FeaturedItem[] {
  const featured = getFeaturedServices();
  return featured.map((service, index) => ({
    service,
    tag: index === 0 ? "Most Popular" : index === 1 ? "New Favorite" : undefined,
    accent: index % 2 === 0 ? "default" : "muted",
  }));
}

export interface SocialProofStat {
  label: string;
  value: string;
}

export const socialProofStats: SocialProofStat[] = [
  { label: "Client engagements", value: "240+" },
  { label: "Avg. satisfaction", value: "4.9/5" },
  { label: "Delivery cycles shortened", value: "31%" },
  { label: "Revenue influenced", value: "$14M+" },
];

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Head of Analytics, Meridian",
    quote:
      "LabQ transformed how we think about our data. The insights were immediate and actionable.",
  },
  {
    name: "James Okafor",
    role: "CTO, Northwave",
    quote: "Their team felt like an extension of ours. Truly invested in our success.",
  },
  {
    name: "Priya Sharma",
    role: "VP Engineering, Catalyst",
    quote: "The platform they built handles 10x our previous traffic without breaking a sweat.",
  },
];
