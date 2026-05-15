interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  color?: string;
}

export default function StatCard({ label, value, change, color = "text-onyx-text" }: StatCardProps) {
  return (
    <div className="bg-onyx-card rounded-xl p-4 border border-onyx-border">
      <p className="text-xs text-onyx-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {change && <p className="text-xs text-onyx-muted mt-1">{change}</p>}
    </div>
  );
}
