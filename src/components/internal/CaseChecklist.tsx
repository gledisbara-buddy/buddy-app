"use client";

import { Check } from "lucide-react";
import { checklistFor } from "@/lib/case-checklist";

export function CaseChecklist({
  caseType,
  checked,
  onToggle,
}: {
  caseType: "booking" | "claim";
  checked: Record<string, boolean>;
  onToggle: (itemId: string, value: boolean) => void;
}) {
  const items = checklistFor(caseType);
  return (
    <div>
      <div className="text-xs mb-2 text-slate uppercase tracking-wide">Checklista</div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id, !isChecked)}
              className="flex items-center gap-2.5 text-left"
            >
              <span
                className="w-5 h-5 rounded-md border flex items-center justify-center flex-none"
                style={{
                  borderColor: isChecked ? "var(--color-forest)" : "var(--color-line)",
                  background: isChecked ? "var(--color-forest)" : "white",
                }}
              >
                {isChecked && <Check size={13} className="text-white" />}
              </span>
              <span className={`text-sm ${isChecked ? "text-slate line-through" : "text-ink"}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
