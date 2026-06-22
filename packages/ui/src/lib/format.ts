// Cache Intl.DateTimeFormat instances by their resolved options.
// Intl formatters are expensive to build; reusing them speeds up repeated calls.
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormat(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(opts);
  let formatter = dateTimeFormatCache.get(key);
  if (!formatter) {
    // eslint-disable-next-line react-doctor/js-hoist-intl -- opts are dynamic; WeakMap cache provides reuse
    formatter = new Intl.DateTimeFormat("en-US", opts);
    dateTimeFormatCache.set(key, formatter);
  }
  return formatter;
}

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";

  try {
    return getDateTimeFormat({
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch {
    return "";
  }
}
