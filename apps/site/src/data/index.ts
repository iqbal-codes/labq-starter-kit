// ── Types ───────────────────────────────────────────────────
export type { Service } from "./services";

// ── Local sample data (fallback source) ─────────────────────
export {
  services,
  categories,
  getFeaturedServices,
  getRelatedServices,
  getServiceBySlug,
  getServicesByCategory,
} from "./services";

// ── Static content (not API-backed) ─────────────────────────
export { getFeaturedItems, socialProofStats, testimonials } from "./featured";
export type { FeaturedItem, SocialProofStat, Testimonial } from "./featured";

// ── API-backed loaders (use these in pages) ─────────────────
export {
  fetchServices,
  fetchFeaturedServices,
  fetchServiceBySlug,
  fetchCategories,
  fetchServicesByCategory,
} from "../lib/storefront-api";
