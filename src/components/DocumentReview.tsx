"use client";

import { useState } from "react";
import { ClassificationResult, DOCTYPE_LABELS } from "@/lib/types";
import { DocumentType } from "@prisma/client";

interface DocumentReviewProps {
  data: ClassificationResult;
  imagePath: string;
  onConfirm: (editedData: ClassificationResult) => void;
  onReject: () => void;
}

export default function DocumentReview({
  data,
  imagePath,
  onConfirm,
  onReject,
}: DocumentReviewProps) {
  const [edited, setEdited] = useState(data);

  function updateField(field: string, value: any) {
    setEdited((prev) => ({ ...prev, [field]: value }));
  }

  function updateTotal(field: string, value: string) {
    setEdited((prev) => ({
      ...prev,
      totals: { ...prev.totals, [field]: parseFloat(value) || 0 },
    }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Oryginalne zdjęcie */}
      <div>
        <h3 className="text-sm font-semibold text-onyx-muted mb-2">Oryginalny dokument</h3>
        <img
          src={imagePath}
          alt="Skan dokumentu"
          className="w-full rounded-xl border border-onyx-border"
        />
      </div>

      {/* Formularz danych */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-onyx-muted mb-2">Rozpoznane dane</h3>

        {/* Typ dokumentu */}
        <div>
          <label className="block text-xs text-onyx-muted mb-1">Typ dokumentu</label>
          <select
            value={edited.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
          >
            {Object.entries(DOCTYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Kontrahent */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Kontrahent</label>
            <input
              value={edited.vendor_name || ""}
              onChange={(e) => updateField("vendor_name", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">NIP</label>
            <input
              value={edited.vendor_nip || ""}
              onChange={(e) => updateField("vendor_nip", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
        </div>

        {/* Numer + daty */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Nr dokumentu</label>
            <input
              value={edited.document_number || ""}
              onChange={(e) => updateField("document_number", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Data wystawienia</label>
            <input
              type="date"
              value={edited.document_date || ""}
              onChange={(e) => updateField("document_date", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Data sprzedaży</label>
            <input
              type="date"
              value={edited.sale_date || ""}
              onChange={(e) => updateField("sale_date", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
        </div>

        {/* Kwoty */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Netto (zł)</label>
            <input
              type="number"
              step="0.01"
              value={edited.totals?.netto ?? ""}
              onChange={(e) => updateTotal("netto", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">VAT (zł)</label>
            <input
              type="number"
              step="0.01"
              value={edited.totals?.vat ?? ""}
              onChange={(e) => updateTotal("vat", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted mb-1">Brutto (zł)</label>
            <input
              type="number"
              step="0.01"
              value={edited.totals?.brutto ?? ""}
              onChange={(e) => updateTotal("brutto", e.target.value)}
              className="w-full px-3 py-2 bg-onyx-bg border border-onyx-border rounded-lg text-onyx-text"
            />
          </div>
        </div>

        {/* Pozycje */}
        {edited.items?.length > 0 && (
          <div>
            <label className="block text-xs text-onyx-muted mb-1">
              Pozycje ({edited.items.length})
            </label>
            <div className="bg-onyx-bg rounded-lg border border-onyx-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-onyx-muted border-b border-onyx-border">
                    <th className="px-2 py-1 text-left">Nazwa</th>
                    <th className="px-2 py-1">Ilość</th>
                    <th className="px-2 py-1">Netto</th>
                    <th className="px-2 py-1">VAT%</th>
                    <th className="px-2 py-1">Brutto</th>
                  </tr>
                </thead>
                <tbody>
                  {edited.items.map((item, i) => (
                    <tr key={i} className="border-b border-onyx-border/50">
                      <td className="px-2 py-1">{item.nazwa}</td>
                      <td className="px-2 py-1 text-center">{item.ilosc} {item.jednostka}</td>
                      <td className="px-2 py-1 text-right">{item.netto?.toFixed(2)}</td>
                      <td className="px-2 py-1 text-center">{((item.stawka_vat || 0) * 100).toFixed(0)}%</td>
                      <td className="px-2 py-1 text-right">{item.brutto?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Przyciski */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => onConfirm(edited)}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
          >
            ✓ Zatwierdź
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-3 bg-red-600/20 text-red-400 border border-red-600 rounded-lg hover:bg-red-600/30 font-semibold transition-colors"
          >
            ✕ Odrzuć
          </button>
        </div>
      </div>
    </div>
  );
}
