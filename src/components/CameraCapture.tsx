"use client";

import { useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    onCapture(file);
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Podgląd dokumentu"
            className="w-full max-h-[400px] object-contain rounded-xl border border-onyx-border"
          />
          <button
            onClick={() => { setPreview(null); }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Aparat (mobile) */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 py-12 border-2 border-dashed border-onyx-border rounded-xl hover:border-onyx-accent transition-colors flex flex-col items-center gap-3 disabled:opacity-50"
          >
            <span className="text-4xl">📸</span>
            <span className="text-onyx-muted">Zrób zdjęcie</span>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          {/* Upload pliku */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 py-12 border-2 border-dashed border-onyx-border rounded-xl hover:border-onyx-accent transition-colors flex flex-col items-center gap-3 disabled:opacity-50"
          >
            <span className="text-4xl">📁</span>
            <span className="text-onyx-muted">Wybierz plik</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
