"use client";

import { CostOwner } from "@prisma/client";
import { OWNER_LABELS, OWNER_COLORS } from "@/lib/types";

const ALL_OWNERS: CostOwner[] = ["onyx", "ogonowscy", "pieloch", "welman"];

interface OwnerFilterProps {
  selected: CostOwner[];
  onChange: (owners: CostOwner[]) => void;
}

export default function OwnerFilter({ selected, onChange }: OwnerFilterProps) {
  function toggle(owner: CostOwner) {
    if (selected.includes(owner)) {
      onChange(selected.filter((o) => o !== owner));
    } else {
      onChange([...selected, owner]);
    }
  }

  const allSelected = selected.length === ALL_OWNERS.length;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-onyx-muted mr-1">Właściciel:</span>
      <button
        onClick={() => onChange(allSelected ? [] : [...ALL_OWNERS])}
        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
          allSelected
            ? "bg-onyx-accent text-white border-onyx-accent"
            : "border-onyx-border text-onyx-muted hover:border-onyx-accent"
        }`}
      >
        Wszyscy
      </button>
      {ALL_OWNERS.map((owner) => {
        const isActive = selected.includes(owner);
        return (
          <button
            key={owner}
            onClick={() => toggle(owner)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              isActive
                ? `${OWNER_COLORS[owner]} text-white border-transparent`
                : "border-onyx-border text-onyx-muted hover:border-onyx-accent"
            }`}
          >
            {OWNER_LABELS[owner]}
          </button>
        );
      })}
    </div>
  );
}
