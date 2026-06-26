"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Duży, pływający przycisk "Nowy skan" widoczny na każdej stronie.
 * Jeden klik → ekran skanowania. Ukryty na samym skanie i logowaniu.
 */
export default function ScanButton() {
  const pathname = usePathname();
  if (pathname === "/skan" || pathname === "/login") return null;

  return (
    <Link
      href="/skan"
      aria-label="Nowy skan"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-onyx-accent px-6 py-3.5 text-white font-semibold shadow-lg shadow-onyx-accent/40 hover:bg-blue-600 active:scale-95 transition-all"
    >
      <span className="text-xl leading-none">📸</span>
      <span>Nowy skan</span>
    </Link>
  );
}
