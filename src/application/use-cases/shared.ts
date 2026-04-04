import { parseMonthParam } from "@/lib/validation";
import { VIDEO_TYPES, type VideoTypeCount } from "@/domain/types";

export function resolveCurrentMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function createZeroDeliveredCount(): VideoTypeCount {
  return VIDEO_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as VideoTypeCount);
}

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

  const currentMonth = resolveCurrentMonth();
  if (availableMonths.includes(currentMonth)) {
    return currentMonth;
  }

  return [...availableMonths].sort((a, b) => b.localeCompare(a))[0] ?? currentMonth;
}
