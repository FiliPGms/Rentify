// ── Formatador de moeda BRL ───────────────────────────────────────────────────
export const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// ── Formatador de data para exibição ─────────────────────────────────────────
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    ...options
  });
}

export function formatMonth(dateString: string): string {
  return formatDate(dateString, { month: '2-digit', year: 'numeric' });
}

export function formatMonthLong(dateString: string): string {
  return formatDate(dateString, { month: 'long', year: 'numeric' });
}

export function todayISO(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
