"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CostOwner } from "@prisma/client";
import OwnerFilter from "@/components/OwnerFilter";
import StatCard from "@/components/StatCard";
import DateRangeSelector, { currentMonthRange } from "@/components/DateRangeSelector";
import DocumentsTable from "@/components/DocumentsTable";

export default function DashboardPage() {
  const { data: session } = useSession();
  const onlyOnyx = (session?.user as { scope?: string })?.scope === "onyx";
  const [owners, setOwners] = useState<CostOwner[]>([
    "onyx",
    "ogonowscy",
    "pieloch",
    "welman",
  ]);
  const [range, setRange] = useState(() => currentMonthRange());
  const [summary, setSummary] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const ownerParam = owners.join(",");

    Promise.all([
      fetch(
        `/api/dashboard/summary?owners=${ownerParam}&from=${range.from}&to=${range.to}`
      ).then((r) => r.json()),
      fetch(
        `/api/documents?owners=${ownerParam}&from=${range.from}&to=${range.to}&limit=10`
      ).then((r) => r.json()),
    ]).then(([sum, docs]) => {
      setSummary(sum);
      setDocuments(docs.documents || []);
      setLoading(false);
    });
  }, [owners, range]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2 }).format(n);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateRangeSelector from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
      </div>

      {!onlyOnyx && (
        <div className="mb-6">
          <OwnerFilter selected={owners} onChange={setOwners} />
        </div>
      )}

      {loading ? (
        <p className="text-onyx-muted">Ładowanie...</p>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Wydatki (netto)"
              value={`${fmt(summary.expenses.netto)} zł`}
              color="text-red-400"
              change={`${summary.expenses.count} dokumentów`}
            />
            <StatCard
              label="VAT naliczony"
              value={`${fmt(summary.expenses.vat)} zł`}
              color="text-amber-400"
            />
            <StatCard
              label="Przychody (netto)"
              value={`${fmt(summary.revenue.netto)} zł`}
              color="text-green-400"
              change={`${summary.revenue.count} faktur`}
            />
            <StatCard
              label="Dokumenty"
              value={`${summary.totalDocs}`}
              color="text-blue-400"
              change={`${summary.pendingDocs} oczekujących`}
            />
          </div>

          <h2 className="text-lg font-semibold mb-3">Ostatnie dokumenty</h2>
          <DocumentsTable documents={documents} />
        </>
      ) : null}
    </div>
  );
}
