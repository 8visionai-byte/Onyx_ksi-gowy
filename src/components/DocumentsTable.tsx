"use client";

import Link from "next/link";
import { OWNER_LABELS, OWNER_COLORS, DOCTYPE_LABELS } from "@/lib/types";

interface DocumentRow {
  id: string;
  documentDate: string | null;
  type: string;
  vendorName: string | null;
  netAmount: number | null;
  vatAmount: number | null;
  costOwner: string;
  status: string;
}

interface DocumentsTableProps {
  documents: DocumentRow[];
  onDelete?: (id: string) => void;
}

export default function DocumentsTable({ documents, onDelete }: DocumentsTableProps) {
  const colCount = onDelete ? 8 : 7;
  return (
    <div className="bg-onyx-card rounded-xl border border-onyx-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-onyx-muted border-b border-onyx-border text-left">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Typ</th>
            <th className="px-4 py-3">Kontrahent</th>
            <th className="px-4 py-3 text-right">Netto</th>
            <th className="px-4 py-3 text-right">VAT</th>
            <th className="px-4 py-3">Właściciel</th>
            <th className="px-4 py-3">Status</th>
            {onDelete && <th className="px-4 py-3 text-right"></th>}
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-onyx-border/50 hover:bg-onyx-bg/50">
              <td className="px-4 py-3">
                <Link href={`/dokumenty/${doc.id}`} className="hover:text-onyx-accent">
                  {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString("pl") : "—"}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded bg-onyx-bg">
                  {DOCTYPE_LABELS[doc.type as keyof typeof DOCTYPE_LABELS] || doc.type}
                </span>
              </td>
              <td className="px-4 py-3">{doc.vendorName || "—"}</td>
              <td className="px-4 py-3 text-right">{doc.netAmount != null ? `${Number(doc.netAmount).toFixed(2)} zł` : "—"}</td>
              <td className="px-4 py-3 text-right">{doc.vatAmount != null ? `${Number(doc.vatAmount).toFixed(2)} zł` : "—"}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded text-white ${OWNER_COLORS[doc.costOwner as keyof typeof OWNER_COLORS] || "bg-gray-500"}`}>
                  {OWNER_LABELS[doc.costOwner as keyof typeof OWNER_LABELS] || doc.costOwner}
                </span>
              </td>
              <td className="px-4 py-3">
                {doc.status === "confirmed" ? <span className="text-green-400">&#10003;</span> :
                 doc.status === "review" ? <span className="text-amber-400">&#9203;</span> :
                 doc.status === "rejected" ? <span className="text-red-400">&#10005;</span> :
                 <span className="text-onyx-muted">&#8943;</span>}
              </td>
              {onDelete && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => { if (confirm("Usunąć ten dokument? Tej operacji nie można cofnąć.")) onDelete(doc.id); }}
                    className="text-red-400 hover:text-red-300 text-sm"
                    title="Usuń dokument"
                  >
                    &#128465;
                  </button>
                </td>
              )}
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-onyx-muted">
                Brak dokumentów
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
