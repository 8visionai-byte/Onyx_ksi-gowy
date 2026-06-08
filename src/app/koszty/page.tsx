"use client";

import { useState, useEffect } from "react";
import { CostOwner } from "@prisma/client";
import OwnerFilter from "@/components/OwnerFilter";
import DateRangeSelector, { currentMonthRange } from "@/components/DateRangeSelector";
import { OWNER_LABELS, OWNER_COLORS } from "@/lib/types";

interface OwnerBreakdown {
  costOwner: CostOwner;
  _sum: {
    netAmount: number | null;
    vatAmount: number | null;
    grossAmount: number | null;
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

const ALL_OWNERS: CostOwner[] = ["onyx", "ogonowscy", "pieloch", "welman"];

export default function KosztyPage() {
  const [range, setRange] = useState(() => currentMonthRange());
  const [owners, setOwners] = useState<CostOwner[]>([...ALL_OWNERS]);
  const [data, setData] = useState<OwnerBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/owners-breakdown?from=${range.from}&to=${range.to}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [range]);

  const filtered = data.filter((row) => owners.includes(row.costOwner));

  const totals = filtered.reduce(
    (acc, row) => ({
      netto: acc.netto + (row._sum.netAmount || 0),
      vat: acc.vat + (row._sum.vatAmount || 0),
      brutto: acc.brutto + (row._sum.grossAmount || 0),
      count: acc.count + row._count,
    }),
    { netto: 0, vat: 0, brutto: 0, count: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-onyx-text">Koszty</h1>
        <DateRangeSelector from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
      </div>

      <OwnerFilter selected={owners} onChange={setOwners} />

      <div className="bg-onyx-card rounded-xl border border-onyx-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-onyx-muted border-b border-onyx-border text-left">
              <th className="px-4 py-3">Wlasciciel</th>
              <th className="px-4 py-3 text-right">Netto</th>
              <th className="px-4 py-3 text-right">VAT</th>
              <th className="px-4 py-3 text-right">Brutto</th>
              <th className="px-4 py-3 text-right">Dokumentow</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-onyx-muted">
                  Ladowanie...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-onyx-muted">
                  Brak danych
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((row) => (
                  <tr
                    key={row.costOwner}
                    className="border-b border-onyx-border/50 hover:bg-onyx-bg/50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded text-white ${
                          OWNER_COLORS[row.costOwner] || "bg-gray-500"
                        }`}
                      >
                        {OWNER_LABELS[row.costOwner] || row.costOwner}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPLN(row._sum.netAmount)} zl
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPLN(row._sum.vatAmount)} zl
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPLN(row._sum.grossAmount)} zl
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
                    {formatPLN(totals.brutto)} zl
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
