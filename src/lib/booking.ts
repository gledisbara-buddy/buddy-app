export const WEEKDAYS = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
export const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];
export const TIME_SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];

export function nextWeekdays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function toIcsUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// Bygger en riktig .ics-fil client-side — inget backend behövs för att en
// bokning ska gå att lägga till i valfri kalenderapp.
export function buildIcsFile(opts: { start: Date; durationMinutes: number; title: string; description: string }): string {
  const end = new Date(opts.start.getTime() + opts.durationMinutes * 60_000);
  const uid = `${opts.start.getTime()}-${Math.random().toString(36).slice(2)}@minbuddy.se`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Buddy//Boka specialist//SV",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(opts.start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(opts.title)}`,
    `DESCRIPTION:${escapeIcsText(opts.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
