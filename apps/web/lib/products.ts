export const DISCOUNT_DAYS_THRESHOLD = 3;
export const DISCOUNT_PERCENT = 15;

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000))) + 1;
}

export function calculateTotal(
  pricePerDay: number,
  startDate: string,
  endDate: string
): { days: number; total: number; hasDiscount: boolean } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = daysBetween(start, end);
  const subtotal = days * pricePerDay;
  const hasDiscount = days > DISCOUNT_DAYS_THRESHOLD;
  const discount = hasDiscount ? subtotal * (DISCOUNT_PERCENT / 100) : 0;
  const total = subtotal - discount;
  return { days, total, hasDiscount };
}
