"use client";

import { Check } from "lucide-react";

export function PillGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-3.5 py-2 rounded-full border text-sm font-medium"
            style={{
              borderColor: active ? "var(--color-forest)" : "var(--color-line)",
              background: active ? "var(--color-frost-2)" : "white",
              color: active ? "var(--color-forest)" : "var(--color-ink)",
            }}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}

export function BoolPill({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <PillGroup
      options={["ja", "nej"] as const}
      labels={{ ja: "Ja", nej: "Nej" }}
      value={value === null ? null : value ? "ja" : "nej"}
      onChange={(v) => onChange(v === "ja")}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-2 block">{label}</label>
      {children}
    </div>
  );
}

export const inputClass = "w-full px-4 py-3 rounded-xl border border-line text-[15px]";

export function FormActions({
  valid,
  onSave,
  onCancel,
}: {
  valid: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 mt-2">
      <button
        onClick={onSave}
        disabled={!valid}
        className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
      >
        Spara <Check size={16} />
      </button>
      <button onClick={onCancel} className="text-sm font-semibold py-2 text-slate">
        Avbryt
      </button>
    </div>
  );
}
