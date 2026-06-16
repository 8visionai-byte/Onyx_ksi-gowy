"use client";

import { useState } from "react";

interface ImagePreviewProps {
  src: string | null | undefined;
  /** Klasa miniatury (element klikalny). Domyślnie mała kwadratowa. */
  thumbClassName?: string;
  /** Tekst zamiast miniatury (np. "Podgląd"). */
  label?: string;
}

/**
 * Klikalna miniatura oryginalnego zdjęcia dokumentu.
 * Klik otwiera pełne zdjęcie w nakładce (lightbox); klik tła/✕ zamyka.
 */
export default function ImagePreview({
  src,
  thumbClassName,
  label,
}: ImagePreviewProps) {
  const [open, setOpen] = useState(false);

  if (!src) return <span className="text-onyx-muted text-xs">—</span>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center"
        title="Kliknij, aby zobaczyć oryginalne zdjęcie"
      >
        {label ? (
          <span className="text-onyx-accent hover:underline text-sm">
            {label}
          </span>
        ) : (
          <img
            src={src}
            alt="Podgląd dokumentu"
            loading="lazy"
            className={
              thumbClassName ||
              "h-10 w-10 object-cover rounded border border-onyx-border hover:opacity-80"
            }
          />
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={src}
            alt="Oryginalne zdjęcie dokumentu"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white/90 hover:text-white text-3xl leading-none"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
