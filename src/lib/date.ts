const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let fmt = dateFormatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    dateFormatterCache.set(key, fmt);
  }
  return fmt;
}

export function monthToLabel(month: string, locale = "fr-FR"): string {
  const [year, rawMonth] = month.split("-");
  const date = new Date(Number(year), Number(rawMonth) - 1, 1);
  return getDateFormatter(locale, { month: "long", year: "numeric" }).format(date);
}

export function toShortDate(value: string, locale = "fr-FR"): string {
  return getDateFormatter(locale, { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value));
}
