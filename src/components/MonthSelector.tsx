"use client";

interface MonthSelectorProps {
  value: string; // YYYY-MM
  onChange: (month: string) => void;
}

export default function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const [year, month] = value.split("-").map(Number);

  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const MONTHS = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
  ];

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => shift(-1)} className="p-1 text-onyx-muted hover:text-onyx-text">&larr;</button>
      <span className="text-sm bg-onyx-card px-3 py-1 rounded-lg border border-onyx-border">
        {MONTHS[month - 1]} {year}
      </span>
      <button onClick={() => shift(1)} className="p-1 text-onyx-muted hover:text-onyx-text">&rarr;</button>
    </div>
  );
}
