export function formatSEK(amount: number): string {
  return `${amount.toLocaleString("sv-SE")} kr`;
}

export function formatBookingDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatBookingPeriod(start: string, end: string): string {
  return `${formatBookingDate(start)} – ${formatBookingDate(end)}`;
}
