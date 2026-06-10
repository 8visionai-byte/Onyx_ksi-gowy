import type { ClassificationResult } from "@/lib/types";

export interface ValidationIssue {
  level: "error" | "warning";
  field: string; // np. "totals.vat", "item.2.vat", "vat_breakdown.23"
  message: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  fixed: ClassificationResult; // kopia z poprawionymi wartościami (VAT=netto×stawka, brutto=netto+VAT, sumy z pozycji)
  hasErrors: boolean;
}

const TOL = 0.02; // tolerancja zaokrągleń (2 grosze)

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// stawka może być ułamkiem (0.23) lub procentem (23) — normalizuj do ułamka
function rateFraction(stawka: number | null | undefined): number | null {
  if (stawka == null || isNaN(stawka)) return null;
  return stawka > 1 ? stawka / 100 : stawka;
}

function approx(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOL;
}

/**
 * Sprawdza spójność arytmetyczną rozpoznanych danych (jak robi księgowy):
 * - VAT = netto × stawka
 * - brutto = netto + VAT
 * - suma pozycji = sumy całkowite
 * - rozbicie VAT: dla każdej stawki VAT = netto × stawka
 * Zwraca listę rozbieżności + poprawioną kopię (wartości przeliczone arytmetycznie).
 */
export function validateClassification(
  data: ClassificationResult
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const fixed: ClassificationResult = JSON.parse(JSON.stringify(data));

  // --- Pozycje ---
  if (Array.isArray(fixed.items)) {
    fixed.items.forEach((item, i) => {
      const netto = typeof item.netto === "number" ? item.netto : null;
      const rate = rateFraction(item.stawka_vat);
      const vat = typeof item.vat === "number" ? item.vat : null;
      const brutto = typeof item.brutto === "number" ? item.brutto : null;
      const label = item.nazwa || `${i + 1}`;

      if (netto != null && rate != null) {
        const expVat = round2(netto * rate);
        if (vat != null && !approx(vat, expVat)) {
          issues.push({
            level: "error",
            field: `item.${i}.vat`,
            message: `Pozycja "${label}": VAT ${vat.toFixed(2)} ≠ netto×stawka ${expVat.toFixed(2)}`,
          });
        }
        item.vat = expVat;
      }

      if (netto != null && item.vat != null) {
        const expBrutto = round2(netto + item.vat);
        if (brutto != null && !approx(brutto, expBrutto)) {
          issues.push({
            level: "error",
            field: `item.${i}.brutto`,
            message: `Pozycja "${label}": brutto ${brutto.toFixed(2)} ≠ netto+VAT ${expBrutto.toFixed(2)}`,
          });
        }
        item.brutto = expBrutto;
      }
    });
  }

  // --- Rozbicie VAT (per stawka) ---
  if (fixed.vat_breakdown && typeof fixed.vat_breakdown === "object") {
    for (const [rateKey, vb] of Object.entries(fixed.vat_breakdown)) {
      const rate = rateFraction(parseFloat(rateKey));
      if (vb && typeof vb.netto === "number" && rate != null) {
        const expVat = round2(vb.netto * rate);
        if (typeof vb.vat === "number" && !approx(vb.vat, expVat)) {
          issues.push({
            level: "error",
            field: `vat_breakdown.${rateKey}`,
            message: `Stawka ${rateKey}%: VAT ${vb.vat.toFixed(2)} ≠ netto×stawka ${expVat.toFixed(2)}`,
          });
        }
        vb.vat = expVat;
      }
    }
  }

  // --- Sumy ---
  const items = fixed.items || [];
  const totals = fixed.totals || { netto: null, vat: null, brutto: null };

  if (items.length > 0) {
    const sumNetto = round2(
      items.reduce((s, it) => s + (typeof it.netto === "number" ? it.netto : 0), 0)
    );
    const sumVat = round2(
      items.reduce((s, it) => s + (typeof it.vat === "number" ? it.vat : 0), 0)
    );
    const sumBrutto = round2(
      items.reduce((s, it) => s + (typeof it.brutto === "number" ? it.brutto : 0), 0)
    );

    if (totals.netto != null && !approx(Number(totals.netto), sumNetto)) {
      issues.push({
        level: "warning",
        field: "totals.netto",
        message: `Suma netto ${Number(totals.netto).toFixed(2)} ≠ suma pozycji ${sumNetto.toFixed(2)}`,
      });
    }
    if (totals.vat != null && !approx(Number(totals.vat), sumVat)) {
      issues.push({
        level: "error",
        field: "totals.vat",
        message: `Suma VAT ${Number(totals.vat).toFixed(2)} ≠ suma pozycji ${sumVat.toFixed(2)}`,
      });
    }
    if (totals.brutto != null && !approx(Number(totals.brutto), sumBrutto)) {
      issues.push({
        level: "warning",
        field: "totals.brutto",
        message: `Suma brutto ${Number(totals.brutto).toFixed(2)} ≠ suma pozycji ${sumBrutto.toFixed(2)}`,
      });
    }

    fixed.totals = { netto: sumNetto, vat: sumVat, brutto: sumBrutto };
  } else if (totals.netto != null && totals.vat != null) {
    const expBrutto = round2(Number(totals.netto) + Number(totals.vat));
    if (totals.brutto != null && !approx(Number(totals.brutto), expBrutto)) {
      issues.push({
        level: "error",
        field: "totals.brutto",
        message: `Brutto ${Number(totals.brutto).toFixed(2)} ≠ netto+VAT ${expBrutto.toFixed(2)}`,
      });
    }
    fixed.totals = { ...totals, brutto: expBrutto };
  }

  return { issues, fixed, hasErrors: issues.some((x) => x.level === "error") };
}
