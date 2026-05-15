"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { href: "/skan", label: "Nowy skan", icon: "📸", primary: true },
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/koszty", label: "Koszty", icon: "💰" },
  { href: "/vat", label: "Rejestr VAT", icon: "🧾" },
  { href: "/produkty", label: "Produkty", icon: "📦" },
  { href: "/dokumenty", label: "Dokumenty", icon: "📁" },
];

const bottomItems = [
  { href: "/ustawienia", label: "Ustawienia", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#1e293b] text-[#e2e8f0]">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-[#334155]">
        <Link href="/" className="text-lg font-bold text-[#3b82f6]">
          📊 Onyx Księgowy
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) =>
          item.primary ? (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="mb-3 flex items-center gap-3 rounded-lg bg-[#3b82f6] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#2563eb]"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(item.href)
                  ? "bg-[#0f172a] text-white"
                  : "text-[#94a3b8] hover:bg-[#0f172a]/50 hover:text-[#e2e8f0]"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[#334155] px-3 py-4 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive(item.href)
                ? "bg-[#0f172a] text-white"
                : "text-[#94a3b8] hover:bg-[#0f172a]/50 hover:text-[#e2e8f0]"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#94a3b8] transition hover:bg-[#0f172a]/50 hover:text-[#e2e8f0]"
        >
          <span>🚪</span>
          Wyloguj
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#1e293b] p-2 text-[#e2e8f0] md:hidden"
        aria-label="Otwórz menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[220px] transform transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] md:block">
        {sidebarContent}
      </aside>
    </>
  );
}
