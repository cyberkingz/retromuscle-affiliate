import { parseMonthParam } from "@/lib/validation";

export function resolveMonth(requestedMonth: string | undefined, availableMonths: string[]): string {
  if (requestedMonth) {
    try {
      const parsed = parseMonthParam(requestedMonth);
      if (parsed) {
        return parsed;
      }
    } catch {
      // Ignore malformed month values and fallback to safe defaults.
    }
  }

  const current = new Date();
  const currentMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
  if (availableMonths.includes(currentMonth)) {
    return currentMonth;
  }

  return [...availableMonths].sort((a, b) => b.localeCompare(a))[0] ?? currentMonth;
}
