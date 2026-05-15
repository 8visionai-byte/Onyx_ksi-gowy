import { CostOwner, DocumentType, DocumentStatus } from "@prisma/client";

export type OwnerFilter = CostOwner[];

export interface DashboardFilters {
  owners: OwnerFilter;
  month: string; // YYYY-MM
}

export interface ClassificationResult {
  type: DocumentType;
  vendor_name: string | null;
  vendor_nip: string | null;
  document_number: string | null;
  document_date: string | null;
  sale_date: string | null;
  items: {
    nazwa: string;
    ilosc: number | null;
    jednostka: string | null;
    cena_jednostkowa: number | null;
    netto: number | null;
    stawka_vat: number | null;
    vat: number | null;
    brutto: number | null;
  }[];
  totals: {
    netto: number | null;
    vat: number | null;
    brutto: number | null;
  };
  vat_breakdown: Record<string, { netto: number; vat: number }>;
}

export const OWNER_LABELS: Record<CostOwner, string> = {
  onyx: "Onyx",
  ogonowscy: "Ogonowscy",
  pieloch: "Pieloch",
  welman: "Welman",
};

export const OWNER_COLORS: Record<CostOwner, string> = {
  onyx: "bg-blue-500",
  ogonowscy: "bg-purple-500",
  pieloch: "bg-green-500",
  welman: "bg-amber-500",
};

export const DOCTYPE_LABELS: Record<DocumentType, string> = {
  faktura_zakup: "Faktura zakupowa",
  faktura_sprzedaz: "Faktura sprzedażowa",
  paragon: "Paragon",
  inny: "Inny",
};
