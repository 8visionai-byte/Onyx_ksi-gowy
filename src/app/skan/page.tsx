"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CameraCapture from "@/components/CameraCapture";
import ClassificationWizard from "@/components/ClassificationWizard";
import DocumentReview from "@/components/DocumentReview";
import { ClassificationResult } from "@/lib/types";
import { CostOwner } from "@prisma/client";

type ScanStep = "capture" | "processing" | "classify" | "review" | "done" | "error";

export default function SkanPage() {
  const [step, setStep] = useState<ScanStep>("capture");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string>("");
  const [classificationData, setClassificationData] = useState<ClassificationResult | null>(null);
  const [owner, setOwner] = useState<CostOwner>("onyx");
  const [isPrivate, setIsPrivate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  const onlyOnyx = (session?.user as { scope?: string })?.scope === "onyx";

  async function handleCapture(file: File) {
    setStep("processing");

    try {
      // 1. Upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/documents/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const { id, imagePath: path } = await uploadRes.json();
      setDocumentId(id);
      setImagePath(path);

      // 2. Analiza AI (Gemini: zdjęcie → dane strukturalne)
      const classifyRes = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id }),
      });

      if (!classifyRes.ok) {
        setStep("error");
        setErrorMsg("AI nie rozpoznało dokumentu. Spróbuj ponownie lub wprowadź dane ręcznie.");
        return;
      }

      const result: ClassificationResult = await classifyRes.json();
      setClassificationData(result);
      if (onlyOnyx) {
        // Pracownik Onyx: koszt zawsze firmowy, pomijamy wybór właściciela
        setOwner("onyx");
        setIsPrivate(false);
        setStep("review");
      } else {
        setStep("classify");
      }
    } catch (err: any) {
      setStep("error");
      setErrorMsg(err.message || "Wystąpił błąd");
    }
  }

  function handleOwnerSelected(selectedOwner: CostOwner, priv: boolean) {
    setOwner(selectedOwner);
    setIsPrivate(priv);
    setStep("review");
  }

  async function handleConfirm(editedData: ClassificationResult) {
    if (!documentId) return;

    await fetch(`/api/documents/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editedData.type,
        costOwner: owner,
        isPrivate,
        status: "confirmed",
        vendorName: editedData.vendor_name,
        vendorNip: editedData.vendor_nip,
        documentNumber: editedData.document_number,
        documentDate: editedData.document_date,
        saleDate: editedData.sale_date,
        netAmount: editedData.totals?.netto,
        vatAmount: editedData.totals?.vat,
        grossAmount: editedData.totals?.brutto,
        items: editedData.items,
      }),
    });

    setStep("done");
  }

  async function handleReject() {
    if (documentId) {
      await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
    }
    resetScan();
  }

  function resetScan() {
    setStep("capture");
    setDocumentId(null);
    setImagePath("");
    setClassificationData(null);
    setErrorMsg("");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📸 Nowy skan</h1>

      {step === "capture" && (
        <CameraCapture onCapture={handleCapture} />
      )}

      {step === "processing" && (
        <div className="text-center py-20">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-onyx-muted">Przetwarzanie dokumentu...</p>
          <p className="text-xs text-onyx-muted mt-2">Gemini analizuje zdjęcie → rozpoznanie i ekstrakcja danych</p>
        </div>
      )}

      {step === "classify" && classificationData && (
        <ClassificationWizard
          aiDetectedType={classificationData.type}
          vendorName={classificationData.vendor_name}
          netAmount={classificationData.totals?.netto}
          onComplete={handleOwnerSelected}
        />
      )}

      {step === "review" && classificationData && (
        <DocumentReview
          data={classificationData}
          imagePath={imagePath}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      )}

      {step === "done" && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Dokument zapisany!</h2>
          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={resetScan}
              className="px-6 py-2 bg-onyx-accent text-white rounded-lg hover:bg-blue-600"
            >
              Skanuj kolejny
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-onyx-card border border-onyx-border text-onyx-text rounded-lg hover:bg-onyx-bg"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 text-red-400">Błąd</h2>
          <p className="text-onyx-muted mb-6">{errorMsg}</p>
          <button
            onClick={resetScan}
            className="px-6 py-2 bg-onyx-accent text-white rounded-lg hover:bg-blue-600"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}
    </div>
  );
}
