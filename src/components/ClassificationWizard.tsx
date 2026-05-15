"use client";

import { useState } from "react";
import { CostOwner } from "@prisma/client";
import { OWNER_LABELS, OWNER_COLORS } from "@/lib/types";

interface ClassificationWizardProps {
  aiDetectedType: string;
  vendorName: string | null;
  netAmount: number | null;
  onComplete: (owner: CostOwner, isPrivate: boolean) => void;
}

export default function ClassificationWizard({
  aiDetectedType,
  vendorName,
  netAmount,
  onComplete,
}: ClassificationWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);

  function handleOwnType(isPrivate: boolean) {
    if (isPrivate) {
      setStep(2);
    } else {
      onComplete("onyx", false);
    }
  }

  function handleFamilySelect(owner: CostOwner) {
    onComplete(owner, true);
  }

  return (
    <div className="bg-onyx-card rounded-xl border border-onyx-border p-6">
      {/* AI detection info */}
      <div className="mb-6 p-4 bg-onyx-bg rounded-lg border border-onyx-border">
        <p className="text-sm text-onyx-muted mb-1">AI rozpoznał:</p>
        <p className="text-lg font-semibold">
          {aiDetectedType} {vendorName && `| ${vendorName}`}{" "}
          {netAmount && `| ${netAmount.toFixed(2)} zł netto`}
        </p>
      </div>

      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Czyj to jest koszt?</h3>
          <div className="flex gap-4">
            <button
              onClick={() => handleOwnType(false)}
              className="flex-1 py-6 bg-blue-500/20 border-2 border-blue-500 rounded-xl text-center hover:bg-blue-500/30 transition-colors"
            >
              <span className="text-2xl block mb-2">🏨</span>
              <span className="font-semibold">Onyx (firmowy)</span>
            </button>
            <button
              onClick={() => handleOwnType(true)}
              className="flex-1 py-6 bg-purple-500/20 border-2 border-purple-500 rounded-xl text-center hover:bg-purple-500/30 transition-colors"
            >
              <span className="text-2xl block mb-2">👨‍👩‍👧‍👦</span>
              <span className="font-semibold">Prywatny</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Która rodzina?</h3>
          <div className="flex gap-4">
            {(["ogonowscy", "pieloch", "welman"] as CostOwner[]).map((owner) => (
              <button
                key={owner}
                onClick={() => handleFamilySelect(owner)}
                className={`flex-1 py-6 ${OWNER_COLORS[owner]}/20 border-2 border-current rounded-xl text-center hover:opacity-80 transition-opacity`}
              >
                <span className="text-2xl block mb-2">👨‍👩‍👧</span>
                <span className="font-semibold">{OWNER_LABELS[owner]}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="mt-4 text-sm text-onyx-muted hover:text-onyx-text"
          >
            ← Wróć
          </button>
        </div>
      )}
    </div>
  );
}
