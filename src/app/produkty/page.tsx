"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CostOwner } from "@prisma/client";
import OwnerFilter from "@/components/OwnerFilter";
import DateRangeSelector, { currentMonthRange } from "@/components/DateRangeSelector";

interface ProductRow {
  nazwa: string;
  ilosc: number;
  netto: number;
  vat: number;
  brutto: number;
}

function formatPLN(value: number | null): string {
  if (value == null) return "0,00";
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ALL_OWNERS: CostOwner[] = ["onyx", "ogonowscy", "pieloch", "welman"];

export default function ProduktyPage() {
  const { data: session } = useSession();
  const onlyOnyx = (session?.user as { scope?: string })?.scope === "onyx";
  const [range, setRange] = useState(() => currentMonthRange());
  const [owners, setOwners] = useState<CostOwner[]>([...ALL_OWNERS]);
  const [data, setData] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ from: range.from, to: range.to });
    if (owners.length > 0 && owners.length < ALL_OWNERS.length) {
      params.set("owners", owners.join(","));
    }
    fetch(`/api/dashboard/expenses?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [range, owners]);

  const totals = data.reduce(
    (acc, row) => ({
      ilosc: acc.ilosc + row.ilosc,
      netto: acc.netto + row.netto,
      vat: acc.vat + row.vat,
      brutto: acc.brutto + row.brutto,
    }),
    { ilosc: 0, netto: 0, vat: 0, brutto: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-onyx-text">Produkty</h1>
        <DateRangeSelector from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
      </div>

      {!onlyOnyx && <OwnerFilter selected={owners} onChange={setOwners} />}

      <div className="bg-onyx-card rounded-xl border border-onyx-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-onyx-muted border-b border-onyx-border text-left">
              <th className="px-4 py-3">Nazwa</th>
              <th className="px-4 py-3 text-right">Ilosc</th>
              <th className="px-4 py-3 text-right">Netto</th>
              <th className="px-4 py-3 text-right">VAT</th>
              <th className="px-4 py-3 text-right">Brutto</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-onyx-muted">
                  Ladowanie...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-onyx-muted">
                  Brak danych
                </td>
              </tr>
            ) : (
              <>
                {data.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-onyx-border/50 hover:bg-onyx-bg/50"
                  >
                    <td className="px-4 py-3 text-onyx-text max-w-xs truncate">
                      {row.nazwa}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.ilosc % 1 === 0 ? row.ilosc : row.ilosc.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPLN(row.netto)} zl
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPLN(row.vat)} zl
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPLN(row.brutto)} zl
                    </td>
                  </tr>
                ))}
                <tr className="bg-onyx-bg/30 font-semibold">
                  <td className="px-4 py-3 text-onyx-text">RAZEM</td>
                  <td className="px-4 py-3 text-right text-onyx-text">
                    {totals.ilosc % 1 === 0
                      ? totals.ilosc
                      : totals.ilosc.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-right text-onyx-text">
                    {formatPLN(totals.netto)} zl
                  </td>
                  <td className="px-4 py-3 text-right text-onyx-text">
                    {formatPLN(totals.vat)} zl
                  </td>
                  <td className="px-4 py-3 text-right text-onyx-text">
                    {formatPLN(totals.brutto)} zl
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
