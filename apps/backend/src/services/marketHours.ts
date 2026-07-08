// NSE/BSE regular equity session: Monday-Friday, 9:15 AM - 3:30 PM IST.
// Indian market holidays aren't accounted for (would need a maintained
// calendar) - treating a holiday as "open" just costs a few harmless Yahoo
// calls that return an unchanged price, not a correctness bug.
const MARKET_OPEN_MINUTES = 9 * 60 + 15;
const MARKET_CLOSE_MINUTES = 15 * 60 + 30;

const istFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  hourCycle: "h23",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
});

export function isMarketOpen(date: Date = new Date()): boolean {
  const parts = istFormatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")!.value;
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const minute = Number(parts.find((p) => p.type === "minute")!.value);

  if (weekday === "Sat" || weekday === "Sun") return false;

  const minutesSinceMidnight = hour * 60 + minute;
  return minutesSinceMidnight >= MARKET_OPEN_MINUTES && minutesSinceMidnight < MARKET_CLOSE_MINUTES;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// India has no DST, so IST is always a fixed +5:30 - shifting the epoch by
// that much and reading it back with UTC getters is a cheap way to get IST
// wall-clock fields without re-parsing Intl parts for date arithmetic.
function toIstShifted(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

function fromIstShifted(shifted: Date): Date {
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

export function getNextMarketOpen(date: Date = new Date()): Date {
  const shifted = toIstShifted(date);
  const minutesNow = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const isWeekday = shifted.getUTCDay() >= 1 && shifted.getUTCDay() <= 5;

  if (isWeekday && minutesNow < MARKET_OPEN_MINUTES) {
    shifted.setUTCHours(9, 15, 0, 0);
    return fromIstShifted(shifted);
  }

  do {
    shifted.setUTCDate(shifted.getUTCDate() + 1);
  } while (shifted.getUTCDay() === 0 || shifted.getUTCDay() === 6);

  shifted.setUTCHours(9, 15, 0, 0);
  return fromIstShifted(shifted);
}

const dateKeyFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric", day: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long" });

// "today"/"tomorrow" when close, otherwise the weekday name (e.g. a Friday
// close skips the weekend and says "Monday").
export function getNextOpenLabel(date: Date = new Date()): string {
  const nextOpen = getNextMarketOpen(date);
  const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  const todayKey = dateKeyFormatter.format(date);
  const tomorrowKey = dateKeyFormatter.format(tomorrow);
  const nextOpenKey = dateKeyFormatter.format(nextOpen);

  let dayLabel: string;
  if (nextOpenKey === todayKey) dayLabel = "today";
  else if (nextOpenKey === tomorrowKey) dayLabel = "tomorrow";
  else dayLabel = weekdayFormatter.format(nextOpen);

  return `Opens ${dayLabel} at 9:15 AM`;
}
