export interface RecurrenceRule {
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";
  timezone: string;
  localTimeMinutes: number;
  weekday?: number | null;
  dayOfMonth?: number | null;
  month?: number | null;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function localParts(date: Date, timezone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
    weekday: weekdayIndex[value("weekday")] ?? 0,
  };
}

function compareLocal(a: Omit<LocalParts, "weekday">, b: LocalParts): number {
  const av = [a.year, a.month, a.day, a.hour, a.minute];
  const bv = [b.year, b.month, b.day, b.hour, b.minute];
  for (let index = 0; index < av.length; index += 1) {
    if (av[index] !== bv[index]) return av[index]! - bv[index]!;
  }
  return 0;
}

function resolveCompatible(
  target: Omit<LocalParts, "weekday">,
  timezone: string,
): Date {
  // The UTC-shaped target is only a search anchor. Searching in ascending instant
  // order naturally selects the earlier side of a fall overlap.
  const anchor = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
  );
  let firstAfter: Date | null = null;
  for (let offset = -18 * 60; offset <= 18 * 60; offset += 1) {
    const candidate = new Date(anchor + offset * 60_000);
    const actual = localParts(candidate, timezone);
    const comparison = compareLocal(target, actual);
    if (comparison === 0) return candidate;
    if (
      comparison < 0 &&
      actual.year === target.year &&
      actual.month === target.month &&
      actual.day === target.day &&
      !firstAfter
    )
      firstAfter = candidate;
  }
  // For a spring gap, Temporal-compatible disambiguation chooses the first
  // representable local time after the gap while preserving calendar date.
  if (firstAfter) {
    const actual = localParts(firstAfter, timezone);
    const targetClock = Date.UTC(
      target.year,
      target.month - 1,
      target.day,
      target.hour,
      target.minute,
    );
    const actualClock = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    return new Date(firstAfter.getTime() + (actualClock - targetClock));
  }
  throw new Error("Unable to resolve local recurrence time");
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function nextOccurrenceAfter(current: Date, rule: RecurrenceRule): Date {
  if (rule.localTimeMinutes < 0 || rule.localTimeMinutes > 1439)
    throw new Error("localTimeMinutes must be between 0 and 1439");
  const currentLocal = localParts(current, rule.timezone);
  const hour = Math.floor(rule.localTimeMinutes / 60);
  const minute = rule.localTimeMinutes % 60;
  let year = currentLocal.year;
  let month = currentLocal.month;
  let day = currentLocal.day;

  if (rule.frequency === "WEEKLY") {
    const targetWeekday = rule.weekday;
    if (targetWeekday === null || targetWeekday === undefined)
      throw new Error("Weekly recurrence requires weekday");
    const delta = ((targetWeekday - currentLocal.weekday + 6) % 7) + 1;
    const calendar = new Date(Date.UTC(year, month - 1, day + delta));
    year = calendar.getUTCFullYear();
    month = calendar.getUTCMonth() + 1;
    day = calendar.getUTCDate();
  } else {
    const step =
      rule.frequency === "MONTHLY"
        ? 1
        : rule.frequency === "QUARTERLY"
          ? 3
          : rule.frequency === "HALF_YEARLY"
            ? 6
            : 12;
    const desiredMonth = rule.month;
    if (rule.frequency === "YEARLY" && desiredMonth) {
      year += desiredMonth <= month ? 1 : 0;
      month = desiredMonth;
    } else {
      const calendar = new Date(Date.UTC(year, month - 1 + step, 1));
      year = calendar.getUTCFullYear();
      month = calendar.getUTCMonth() + 1;
    }
    day = Math.min(
      rule.dayOfMonth ?? currentLocal.day,
      daysInMonth(year, month),
    );
  }
  return resolveCompatible({ year, month, day, hour, minute }, rule.timezone);
}
