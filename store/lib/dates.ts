const DAY_MS = 24 * 60 * 60 * 1000;

const shortDayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const longDayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

export function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDayKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export function shortDay(key: string): string {
  return shortDayFormat.format(fromDayKey(key));
}

export function longDay(date: Date): string {
  return longDayFormat.format(date);
}
