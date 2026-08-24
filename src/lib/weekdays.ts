export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Monday of the current week, as a YYYY-MM-DD date-only string.
export function getMostRecentMonday(from: Date = new Date()): string {
  const day = from.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(from.getTime() - diff * 86400000);
  return monday.toISOString().slice(0, 10);
}
