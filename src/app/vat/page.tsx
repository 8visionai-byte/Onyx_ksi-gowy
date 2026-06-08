"use client";

import { useState, useEffect } from "react";
import { CostOwner } from "@prisma/client";
import OwnerFilter from "@/components/OwnerFilter";
import DateRangeSelector, { currentMonthRange } from "@/components/DateRangeSelector";

interface VatRow {
  vatRate: number | null;
  _sum: {
    netAmount: number | null;
    vatAmount: number | null;
  };
  _count: number;
}

function formatPLN(value: number | null): string {
  if (value == null) return "0,00";
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRate(rate: number | null): string {
  if (rate == null) return "b/d";
  return `${rate}%`;
}

const ALL_OWNERS: CostOwner[] = ["onyx", "ogonowscy", "pieloch", "welman"];
const VAT_RATES_ORDER = [23, 8, 5, 0];

export default function VatPage() {
  const [range, setRange] = useState(() => currentMonthRange());
  const [owners, setOwners] = useState<CostOwner[]>([...ALL_OWNERS]);
  const [data, setData] = useState<VatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ from: range.from, to: range.to });
    if (owners.length > 0 && owners.length < ALL_OWNERS.length) {
      params.set("owners", owners.join(","));
    }
    fetch(`/api/dashboard/vat?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [range, owners]);

  // Sort by predefined rate order, unknowns at end
  const sorted = [...data].sort((a, b) => {
    const idxA = VAT_RATES_ORDER.indexOf(Number(a.vatRate));
    const idxB = VAT_RATES_ORDER.indexOf(Number(b.vatRate));
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  const totals = sorted.reduce(
    (acc, row) => ({
      netto: acc.netto + (row._sum.netAmount || 0),
      vat: acc.vat + (row._sum.vatAmount || 0),
      count: acc.count + row._count,
    }),
    { netto: 0, vat: 0, count: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-onyx-text">Rejestr VAT</h1>
        <DateRangeSelector from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
      </div>

      <OwnerFilter selected={owners} onChange={setOwners} />

      {/* Podsumowanie: ile łącznie VAT-u */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-onyx-card rounded-xl border border-onyx-border p-4">
          <p className="text-xs text-onyx-muted">Razem netto</p>
          <p className="text-2xl font-bold text-onyx-text mt-1">
            {loading ? "—" : `${formatPLN(totals.netto)} zł`}
          </p>
        </div>
        <div className="bg-onyx-card rounded-xl border border-onyx-accent/50 p-4">
          <p className="text-xs text-onyx-muted">Razem VAT</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {loading ? "—" : `${formatPLN(totals.vat)} zł`}
          </p>
        </div>
      </div>

      <div className="bg-onyx-card rounded-xl border border-onyx-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-onyx-muted border-b border-onyx-border text-left">
              <th className="px-4 py-3">Stawka VAT</th>
              <th className="px-4 py-3 text-right">Netto</th>
              <th className="px-4 py-3 text-right">VAT</th>
              <th className="px-4 py-3 text-right">Pozycji</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-onyx-muted">
                  Ladowanie...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-onyx-muted">
                  Brak danych
                </td>
              </tr>
            ) : (
              <>
                {sorted.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-onyx-border/50 hover:bg-onyx-bg/50"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-onyx-accent text-white">
                        {formatRate(row.vatRate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPLN(row._sum.netAmount)} zl
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPLN(row._sum.vatAmount)} zl
                    </td>
                    <td className="px-4 py-3 text-right">{row._count}</td>
                  </tr>
                ))}
                <tr className="bg-onyx-bg/30 font-semibold">
                  <td className="px-4 py-3 text-onyx-text">RAZEM</td>
                  <td className="px-4 py-3 text-right text-onyx-text">
                    {formatPLN(totals.netto)} zl
                  </td>
                  <td className="px-4 py-3 text-right text-onyx-text">
                    {formatPLN(totals.vat)} zl
                  </td>
                  <td className="px-4 py-3 text-right text-onyx-text">
                    {totals.count}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
