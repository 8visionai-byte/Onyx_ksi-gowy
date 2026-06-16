"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ImagePreview from "@/components/ImagePreview";
import { OWNER_LABELS, OWNER_COLORS, DOCTYPE_LABELS } from "@/lib/types";
import { CostOwner, DocumentType, DocumentStatus } from "@prisma/client";

interface DocumentItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  netAmount: number | null;
  vatRate: number | null;
  vatAmount: number | null;
  grossAmount: number | null;
}

interface DocumentData {
  id: string;
  type: DocumentType;
  costOwner: CostOwner;
  isPrivate: boolean;
  status: DocumentStatus;
  vendorName: string | null;
  vendorNip: string | null;
  documentNumber: string | null;
  documentDate: string | null;
  saleDate: string | null;
  netAmount: number | null;
  vatAmount: number | null;
  grossAmount: number | null;
  imagePath: string;
  notes: string | null;
  createdAt: string;
  items: DocumentItem[];
}

function formatPLN(value: number | null): string {
  if (value == null) return "—";
  return Number(value).toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pl-PL");
}

const STATUS_LABELS: Record<string, string> = {
  processing: "Przetwarzanie",
  review: "Do weryfikacji",
  confirmed: "Potwierdzone",
  rejected: "Odrzucone",
};

const STATUS_COLORS: Record<string, string> = {
  processing: "text-onyx-muted",
  review: "text-amber-400",
  confirmed: "text-green-400",
  rejected: "text-red-400",
};

const ALL_STATUSES: DocumentStatus[] = ["processing", "review", "confirmed", "rejected"];
const ALL_OWNERS: CostOwner[] = ["onyx", "ogonowscy", "pieloch", "welman"];
const ALL_TYPES: DocumentType[] = ["faktura_zakup", "faktura_sprzedaz", "paragon", "inny"];

export default function DokumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Edit fields
  const [editStatus, setEditStatus] = useState<DocumentStatus>("processing");
  const [editOwner, setEditOwner] = useState<CostOwner>("onyx");
  const [editType, setEditType] = useState<DocumentType>("faktura_zakup");
  const [editVendorName, setEditVendorName] = useState("");
  const [editVendorNip, setEditVendorNip] = useState("");
  const [editDocNumber, setEditDocNumber] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/documents/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setDoc(d);
        setEditStatus(d.status);
        setEditOwner(d.costOwner);
        setEditType(d.type);
        setEditVendorName(d.vendorName || "");
        setEditVendorNip(d.vendorNip || "");
        setEditDocNumber(d.documentNumber || "");
        setEditNotes(d.notes || "");
      })
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          costOwner: editOwner,
          type: editType,
          vendorName: editVendorName || null,
          vendorNip: editVendorNip || null,
          documentNumber: editDocNumber || null,
          notes: editNotes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Blad zapisu");
      }
      const updated = await res.json();
      setDoc(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blad zapisu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Usunąć ten dokument? Tej operacji nie można cofnąć.")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    router.push("/dokumenty");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-onyx-muted">
        Ladowanie...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="space-y-4">
        <Link
          href="/dokumenty"
          className="text-sm text-onyx-accent hover:underline"
        >
          &larr; Powrot do listy
        </Link>
        <div className="bg-onyx-card rounded-xl border border-onyx-border p-8 text-center text-onyx-muted">
          Dokument nie zostal znaleziony
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dokumenty"
          className="text-sm text-onyx-accent hover:underline"
        >
          &larr; Powrot do listy
        </Link>
        {!editing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-1.5 text-sm rounded-lg bg-onyx-accent text-white hover:bg-onyx-accent/80"
            >
              Edytuj
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-1.5 text-sm rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
            >
              &#128465; Usuń dokument
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-1.5 text-sm rounded-lg border border-onyx-border text-onyx-muted hover:text-onyx-text"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image preview */}
        <div className="bg-onyx-card rounded-xl border border-onyx-border p-4">
          <h2 className="text-sm text-onyx-muted mb-3">
            Podglad dokumentu{" "}
            <span className="text-xs text-onyx-muted/70">(kliknij, aby powiększyć)</span>
          </h2>
          <div className="bg-onyx-bg rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
            {doc.imagePath ? (
              <ImagePreview
                src={doc.imagePath}
                thumbClassName="max-w-full max-h-[500px] object-contain cursor-zoom-in"
              />
            ) : (
              <span className="text-onyx-muted text-sm">Brak obrazu</span>
            )}
          </div>
        </div>

        {/* Document fields */}
        <div className="bg-onyx-card rounded-xl border border-onyx-border p-4 space-y-4">
          <h2 className="text-sm text-onyx-muted mb-1">Dane dokumentu</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-onyx-muted text-xs">Typ</label>
              {editing ? (
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as DocumentType)}
                  className="w-full bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-onyx-text mt-0.5"
                >
                  {ALL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {DOCTYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-onyx-text">{DOCTYPE_LABELS[doc.type]}</p>
              )}
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Status</label>
              {editing ? (
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as DocumentStatus)
                  }
                  className="w-full bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-onyx-text mt-0.5"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={STATUS_COLORS[doc.status]}>
                  {STATUS_LABELS[doc.status]}
                </p>
              )}
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Wlasciciel</label>
              {editing ? (
                <select
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value as CostOwner)}
                  className="w-full bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-onyx-text mt-0.5"
                >
                  {ALL_OWNERS.map((o) => (
                    <option key={o} value={o}>
                      {OWNER_LABELS[o]}
                    </option>
                  ))}
                </select>
              ) : (
                <p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded text-white ${OWNER_COLORS[doc.costOwner]}`}
                  >
                    {OWNER_LABELS[doc.costOwner]}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Kontrahent</label>
              {editing ? (
                <input
                  value={editVendorName}
                  onChange={(e) => setEditVendorName(e.target.value)}
                  className="w-full bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-onyx-text mt-0.5"
                />
              ) : (
                <p className="text-onyx-text">{doc.vendorName || "—"}</p>
              )}
            </div>

            <div>
              <label className="text-onyx-muted text-xs">NIP</label>
              {editing ? (
                <input
                  value={editVendorNip}
                  onChange={(e) => setEditVendorNip(e.target.value)}
                  className="w-full bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-onyx-text mt-0.5"
                />
              ) : (
                <p className="text-onyx-text">{doc.vendorNip || "—"}</p>
              )}
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Numer dokumentu</label>
              {editing ? (
                <input
                  value={editDocNumber}
                  onChange={(e) => setEditDocNumber(e.target.value)}
                  className="w-full bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-onyx-text mt-0.5"
                />
              ) : (
                <p className="text-onyx-text">{doc.documentNumber || "—"}</p>
              )}
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Data dokumentu</label>
              <p className="text-onyx-text">{formatDate(doc.documentDate)}</p>
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Data sprzedazy</label>
              <p className="text-onyx-text">{formatDate(doc.saleDate)}</p>
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Netto</label>
              <p className="text-onyx-text">{formatPLN(doc.netAmount)} zl</p>
            </div>

            <div>
              <label className="text-onyx-muted text-xs">VAT</label>
              <p className="text-onyx-text">{formatPLN(doc.vatAmount)} zl</p>
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Brutto</label>
              <p className="text-onyx-text">{formatPLN(doc.grossAmount)} zl</p>
            </div>

            <div>
              <label className="text-onyx-muted text-xs">Utworzono</label>
              <p className="text-onyx-text">{formatDate(doc.createdAt)}</p>
            </div>
          </div>

          <div>
            <label className="text-onyx-muted text-xs">Notatki</label>
            {editing ? (
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="w-full bg-onyx-bg border border-onyx-border rounded px-2 py-1 text-onyx-text mt-0.5 resize-none"
              />
            ) : (
              <p className="text-onyx-text text-sm">{doc.notes || "—"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      {doc.items && doc.items.length > 0 && (
        <div className="bg-onyx-card rounded-xl border border-onyx-border overflow-x-auto">
          <h2 className="text-sm text-onyx-muted px-4 pt-3 pb-1">
            Pozycje ({doc.items.length})
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-onyx-muted border-b border-onyx-border text-left">
                <th className="px-4 py-2">Nazwa</th>
                <th className="px-4 py-2 text-right">Ilosc</th>
                <th className="px-4 py-2">Jedn.</th>
                <th className="px-4 py-2 text-right">Cena j.</th>
                <th className="px-4 py-2 text-right">Netto</th>
                <th className="px-4 py-2 text-right">VAT %</th>
                <th className="px-4 py-2 text-right">VAT</th>
                <th className="px-4 py-2 text-right">Brutto</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-onyx-border/50 hover:bg-onyx-bg/50"
                >
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2 text-right">
                    {item.quantity != null ? Number(item.quantity) : "—"}
                  </td>
                  <td className="px-4 py-2">{item.unit || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    {formatPLN(item.unitPrice != null ? Number(item.unitPrice) : null)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatPLN(item.netAmount != null ? Number(item.netAmount) : null)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {item.vatRate != null ? `${Number(item.vatRate)}%` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatPLN(item.vatAmount != null ? Number(item.vatAmount) : null)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatPLN(
                      item.grossAmount != null ? Number(item.grossAmount) : null
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
