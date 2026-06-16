"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CostOwner, DocumentType, DocumentStatus } from "@prisma/client";
import OwnerFilter from "@/components/OwnerFilter";
import DateRangeSelector, { currentMonthRange } from "@/components/DateRangeSelector";
import DocumentsTable from "@/components/DocumentsTable";
import { DOCTYPE_LABELS } from "@/lib/types";

interface DocumentRow {
  id: string;
  documentDate: string | null;
  type: string;
  vendorName: string | null;
  netAmount: number | null;
  vatAmount: number | null;
  costOwner: string;
  status: string;
  imagePath: string | null;
}

const ALL_OWNERS: CostOwner[] = ["onyx", "ogonowscy", "pieloch", "welman"];
const STATUS_LABELS: Record<string, string> = {
  processing: "Przetwarzanie",
  review: "Do weryfikacji",
  confirmed: "Potwierdzone",
  rejected: "Odrzucone",
};

export default function DokumentyPage() {
  const { data: session } = useSession();
  const onlyOnyx = (session?.user as { scope?: string })?.scope === "onyx";
  const [range, setRange] = useState(() => currentMonthRange());
  const [owners, setOwners] = useState<CostOwner[]>([...ALL_OWNERS]);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      from: range.from,
      to: range.to,
      page: String(page),
      limit: String(limit),
    });
    if (owners.length > 0 && owners.length < ALL_OWNERS.length) {
      params.set("owners", owners.join(","));
    }
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (searchDebounced) params.set("search", searchDebounced);

    fetch(`/api/documents?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setDocuments(d.documents || []);
        setTotal(d.total || 0);
      })
      .catch(() => {
        setDocuments([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [range, owners, typeFilter, statusFilter, searchDebounced, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [range, owners, typeFilter, statusFilter, searchDebounced]);

  async function handleDelete(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    fetchData();
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-onyx-text">Dokumenty</h1>
        <DateRangeSelector from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
      </div>

      <div className="flex flex-col gap-4">
        {!onlyOnyx && <OwnerFilter selected={owners} onChange={setOwners} />}

        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <input
            type="text"
            placeholder="Szukaj (kontrahent, numer)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-onyx-card border border-onyx-border rounded-lg px-3 py-1.5 text-sm text-onyx-text placeholder:text-onyx-muted focus:outline-none focus:border-onyx-accent w-64"
          />

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-onyx-card border border-onyx-border rounded-lg px-3 py-1.5 text-sm text-onyx-text focus:outline-none focus:border-onyx-accent"
          >
            <option value="">Wszystkie typy</option>
            {Object.entries(DOCTYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-onyx-card border border-onyx-border rounded-lg px-3 py-1.5 text-sm text-onyx-text focus:outline-none focus:border-onyx-accent"
          >
            <option value="">Wszystkie statusy</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <span className="text-xs text-onyx-muted ml-auto">
            {total} dokument{total === 1 ? "" : total < 5 ? "y" : "ow"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="bg-onyx-card rounded-xl border border-onyx-border p-8 text-center text-onyx-muted">
          Ladowanie...
        </div>
      ) : (
        <DocumentsTable documents={documents} onDelete={handleDelete} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm rounded bg-onyx-card border border-onyx-border text-onyx-muted hover:text-onyx-text disabled:opacity-40"
          >
            Poprzednia
          </button>
          <span className="text-sm text-onyx-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm rounded bg-onyx-card border border-onyx-border text-onyx-muted hover:text-onyx-text disabled:opacity-40"
          >
            Nastepna
          </button>
        </div>
      )}
    </div>
  );
}
