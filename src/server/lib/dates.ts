export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const targetMonth = next.getUTCMonth();
  const day = Math.min(
    date.getUTCDate(),
    new Date(Date.UTC(next.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate()
  );
  return new Date(Date.UTC(next.getUTCFullYear(), targetMonth, day));
}

export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
