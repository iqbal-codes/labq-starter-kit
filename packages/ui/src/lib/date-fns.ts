import { format, formatDistance, formatRelative, isToday, isYesterday, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { Locale } from "date-fns";

const locales: Record<"en" | "id", Locale | undefined> = {
  id,
  en: undefined,
};

export function getDateFnsLocale(locale: "en" | "id"): Locale | undefined {
  return locales[locale];
}

export function formatDate(
  date: Date | string,
  formatStr: string,
  locale: "en" | "id" = "en",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: getDateFnsLocale(locale) });
}

export function formatDateDistance(
  date: Date | string,
  baseDate?: Date | string,
  locale: "en" | "id" = "en",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const base = baseDate
    ? typeof baseDate === "string"
      ? parseISO(baseDate)
      : baseDate
    : new Date();
  return formatDistance(dateObj, base, { locale: getDateFnsLocale(locale), addSuffix: true });
}

export function formatDateRelative(
  date: Date | string,
  baseDate?: Date | string,
  locale: "en" | "id" = "en",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const base = baseDate
    ? typeof baseDate === "string"
      ? parseISO(baseDate)
      : baseDate
    : new Date();

  if (isToday(dateObj)) {
    return format(dateObj, "p", { locale: getDateFnsLocale(locale) });
  }
  if (isYesterday(dateObj)) {
    return locale === "id" ? "Kemarin" : "Yesterday";
  }
  return formatRelative(dateObj, base, { locale: getDateFnsLocale(locale) });
}
