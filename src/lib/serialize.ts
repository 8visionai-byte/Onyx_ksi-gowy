/**
 * Rekurencyjnie zamienia obiekty Prisma.Decimal na zwykłe liczby (number).
 *
 * Pola Decimal (netAmount, vatAmount, grossAmount, vatRate...) serializują się
 * w JSON do STRINGA, przez co frontend wywala się na `.toFixed()` i błędnie sumuje
 * (konkatenacja stringów). Ta funkcja konwertuje je na liczby przed wysłaniem odpowiedzi.
 *
 * Zachowuje Date i pozostałe typy bez zmian.
 */
export function decimalsToNumbers<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (typeof value === "object") {
    const v = value as unknown as {
      toNumber?: unknown;
      toFixed?: unknown;
    };
    // Decimal.js (Prisma.Decimal) ma metody toNumber i toFixed
    if (typeof v.toNumber === "function" && typeof v.toFixed === "function") {
      return (v.toNumber as () => number)() as unknown as T;
    }
    if (value instanceof Date) return value;
    if (Array.isArray(value)) {
      return value.map((el) => decimalsToNumbers(el)) as unknown as T;
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out[key] = decimalsToNumbers((value as Record<string, unknown>)[key]);
    }
    return out as unknown as T;
  }

  return value;
}
