import type { Service } from "../data/services";
import { services as localServices, categories as localCategories } from "../data/services";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "http://localhost:4000";
const ORG_SLUG = import.meta.env.PUBLIC_ORG_SLUG || "";
const PAGE_SIZE = 100;

interface ApiServiceRecord {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  price: string | null;
  createdAt: string;
}

interface ApiServiceListResponse {
  items: ApiServiceRecord[];
  total: number;
}

interface ApiServiceDetailResponse {
  service: ApiServiceRecord | null;
}

interface ApiCategory {
  slug: string;
  label: string;
}

interface ApiCategoryListResponse {
  categories: ApiCategory[];
}

interface SuccessfulFetch<T> {
  ok: true;
  data: T;
}

interface FailedFetch {
  ok: false;
  data: null;
}

function toService(record: ApiServiceRecord): Service {
  const description = record.description ?? "";
  const parsedPrice = record.price === null ? null : parseFloat(record.price);
  const priceCents =
    parsedPrice !== null && Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) : null;
  const category = record.category?.trim() || "Uncategorized";

  return {
    slug: record.slug,
    title: record.name,
    subtitle: "",
    description,
    category,
    categorySlug:
      category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "uncategorized",
    priceCents,
    durationMinutes: 120,
    durationLabel: "2–4 weeks",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=700&fit=crop",
    featured: false,
    content: description || "Contact us to learn more about this service.",
    relatedSlugs: [],
  };
}

function storefrontUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, API_BASE);
  url.searchParams.set("org", ORG_SLUG);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function safeFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<SuccessfulFetch<T> | FailedFetch> {
  if (!ORG_SLUG) {
    return { ok: false, data: null };
  }

  try {
    const response = await fetch(storefrontUrl(path, params), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return { ok: false, data: null };
    }

    return {
      ok: true,
      data: (await response.json()) as T,
    };
  } catch {
    return { ok: false, data: null };
  }
}

async function fetchAllServiceRecords(): Promise<
  SuccessfulFetch<ApiServiceRecord[]> | FailedFetch
> {
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  const records: ApiServiceRecord[] = [];

  while (offset < total) {
    const result = await safeFetch<ApiServiceListResponse>("/api/storefront/services/list", {
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });

    if (!result.ok) {
      return { ok: false, data: null };
    }

    records.push(...result.data.items);
    total = result.data.total;
    offset += result.data.items.length;

    if (result.data.items.length === 0) {
      break;
    }
  }

  return { ok: true, data: records };
}

export async function fetchServices(): Promise<Service[]> {
  const result = await fetchAllServiceRecords();

  if (result.ok) {
    return result.data.map(toService);
  }

  return localServices;
}

export async function fetchFeaturedServices(limit = 4): Promise<Service[]> {
  const result = await safeFetch<ApiServiceRecord[]>("/api/storefront/services/featured", {
    limit: String(limit),
  });

  if (result.ok) {
    return result.data.map(toService);
  }

  return localServices.filter((service) => service.featured).slice(0, limit);
}

export async function fetchServiceBySlug(
  slug: string,
): Promise<{ service: Service; related: Service[] } | null> {
  const result = await safeFetch<ApiServiceDetailResponse>("/api/storefront/services/detail", {
    slug,
  });

  if (result.ok) {
    if (!result.data.service) {
      return null;
    }

    return { service: toService(result.data.service), related: [] };
  }

  const local = localServices.find((service) => service.slug === slug);
  if (!local) {
    return null;
  }

  const related = local.relatedSlugs
    .map((relatedSlug) => localServices.find((candidate) => candidate.slug === relatedSlug))
    .filter((candidate): candidate is Service => candidate !== undefined);

  return { service: local, related };
}

export async function fetchCategories(): Promise<readonly { slug: string; label: string }[]> {
  const categoriesResult = await safeFetch<ApiCategoryListResponse>("/api/storefront/categories");

  if (categoriesResult.ok) {
    return categoriesResult.data.categories;
  }

  return localCategories;
}

export async function fetchServicesByCategory(): Promise<
  { slug: string; label: string; services: Service[] }[]
> {
  const result = await fetchAllServiceRecords();

  if (result.ok) {
    const services = result.data.map(toService);
    if (services.length === 0) {
      return [];
    }

    const grouped = new Map<string, { slug: string; label: string; services: Service[] }>();

    for (const service of services) {
      const existing = grouped.get(service.categorySlug);
      if (existing) {
        existing.services.push(service);
      } else {
        grouped.set(service.categorySlug, {
          slug: service.categorySlug,
          label: service.category,
          services: [service],
        });
      }
    }

    return Array.from(grouped.values());
  }

  return localCategories.map((category) => ({
    ...category,
    services: localServices.filter((service) => service.categorySlug === category.slug),
  }));
}
