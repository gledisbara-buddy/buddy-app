"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { inputClass } from "@/components/onboarding/shared";

export function EditableField({
  label,
  value,
  placeholder = "T.ex. Sam",
  onSave,
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  onSave: (newValue: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const startEdit = () => {
    setDraft(value ?? "");
    setError(false);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError(false);
    const ok = await onSave(draft.trim());
    setSaving(false);
    if (ok) setEditing(false);
    else setError(true);
  };

  return (
    <div>
      <div className="text-xs mb-1 text-slate uppercase tracking-wide">{label}</div>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            className={`${inputClass} py-2 text-sm`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder={placeholder}
          />
          <button
            onClick={save}
            disabled={saving}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-none text-white bg-forest disabled:opacity-50"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-none text-slate border border-line"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="group flex items-center gap-2 min-h-[28px]">
          {value ? (
            <>
              <span className="text-sm font-medium">{value}</span>
              <button onClick={startEdit} className="opacity-0 group-hover:opacity-100 text-slate hover:text-forest">
                <Pencil size={13} />
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-slate">Uppgift saknas</span>
              <button onClick={startEdit} className="text-xs font-semibold text-forest">
                + Lägg till
              </button>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">Kunde inte spara.</p>}
    </div>
  );
}
