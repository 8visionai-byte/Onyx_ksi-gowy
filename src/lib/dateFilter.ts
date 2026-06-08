export interface DateRange {
  gte?: Date;
  lt?: Date;
}

/** Parsuje from/to (YYYY-MM-DD) na zakres. Brak obu => null (całość, bez filtra). */
export function parseRange(
  from?: string | null,
  to?: string | null
): DateRange | null {
  if (!from && !to) return null;
  const range: DateRange = {};
  if (from) range.gte = new Date(`${from}T00:00:00`);
  if (to) {
    const d = new Date(`${to}T00:00:00`);
    d.setDate(d.getDate() + 1); // koniec dnia "to" włącznie
    range.lt = d;
  }
  return range;
}

/**
 * Warunek Prisma na zakres dat dokumentu: wg documentDate,
 * a gdy documentDate == null — wg createdAt (żeby świeże skany bez rozpoznanej daty nie znikały).
 * Zwraca null gdy brak zakresu (całość).
 */
export function documentDateCondition(
  from?: string | null,
  to?: string | null
): { OR: unknown[] } | null {
  const range = parseRange(from, to);
  if (!range) return null;
  return {
    OR: [
      { documentDate: range },
      { AND: [{ documentDate: null }, { createdAt: range }] },
    ],
  };
}
