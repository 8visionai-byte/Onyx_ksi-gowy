"use client";

export interface DateRangeValue {
  from: string; // YYYY-MM-DD lub "" = całość
  to: string;
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function currentMonthRange(): DateRangeValue {
  const now = new Date();
  return {
    from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

interface DateRangeSelectorProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export default function DateRangeSelector({ from, to, onChange }: DateRangeSelectorProps) {
  function thisMonth() {
    const r = currentMonthRange();
    onChange(r.from, r.to);
  }
  function prevMonth() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    onChange(fmt(first), fmt(last));
  }
  function thisYear() {
    const y = new Date().getFullYear();
    onChange(`${y}-01-01`, `${y}-12-31`);
  }
  function all() {
    onChange("", "");
  }

  const isAll = !from && !to;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={thisMonth} className="px-3 py-1 rounded-lg text-xs border border-onyx-border text-onyx-muted hover:border-onyx-accent">Ten miesiąc</button>
      <button onClick={prevMonth} className="px-3 py-1 rounded-lg text-xs border border-onyx-border text-onyx-muted hover:border-onyx-accent">Poprzedni miesiąc</button>
      <button onClick={thisYear} className="px-3 py-1 rounded-lg text-xs border border-onyx-border text-onyx-muted hover:border-onyx-accent">Ten rok</button>
      <button onClick={all} className={`px-3 py-1 rounded-lg text-xs border ${isAll ? "bg-onyx-accent text-white border-onyx-accent" : "border-onyx-border text-onyx-muted hover:border-onyx-accent"}`}>Wszystko</button>
      <div className="flex items-center gap-1 ml-2">
        <input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className="px-2 py-1 bg-onyx-card border border-onyx-border rounded-lg text-xs text-onyx-text" />
        <span className="text-onyx-muted text-xs">—</span>
        <input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className="px-2 py-1 bg-onyx-card border border-onyx-border rounded-lg text-xs text-onyx-text" />
      </div>
    </div>
  );
}
