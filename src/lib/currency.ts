const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
    formatterCache.set(key, fmt);
  }
  return fmt;
}

export function formatCurrency(value: number, locale = "fr-FR", currency = "EUR"): string {
  return getFormatter(locale, currency).format(value);
}
