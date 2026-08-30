"use client";

import { Children, cloneElement, isValidElement, useId, useState, type ReactElement } from "react";
import { Check, Eye, EyeOff } from "lucide-react";

const LABELABLE_TAGS = new Set(["input", "textarea", "select"]);

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

export function MultiPillGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onChange: (v: T[]) => void;
}) {
  const toggle = (opt: T) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
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

export function PillGroupWithOther({
  options,
  value,
  onChange,
  otherPlaceholder = "Ange eget",
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  otherPlaceholder?: string;
}) {
  const [otherActive, setOtherActive] = useState(value.length > 0 && !options.includes(value));

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.map((opt) => {
          const active = !otherActive && value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setOtherActive(false);
                onChange(opt);
              }}
              className="px-3.5 py-2 rounded-full border text-sm font-medium"
              style={{
                borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                background: active ? "var(--color-frost-2)" : "white",
                color: active ? "var(--color-forest)" : "var(--color-ink)",
              }}
            >
              {opt}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setOtherActive(true);
            onChange("");
          }}
          className="px-3.5 py-2 rounded-full border text-sm font-medium"
          style={{
            borderColor: otherActive ? "var(--color-forest)" : "var(--color-line)",
            background: otherActive ? "var(--color-frost-2)" : "white",
            color: otherActive ? "var(--color-forest)" : "var(--color-ink)",
          }}
        >
          Annat
        </button>
      </div>
      {otherActive && (
        <input
          className={`${inputClass} mb-2`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={otherPlaceholder}
        />
      )}
    </>
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

// Kopplar label till fältet med htmlFor/id (skärmläsarstöd) när barnet är
// ett enda vanligt formulärelement (input/textarea/select) — det täcker
// stora majoriteten av alla ~40 användningsställen automatiskt utan att
// varje anropsplats behöver ändras. Barn som inte matchar (t.ex. en
// input inlindad i en relativ div för en spinner, eller en PillGroup)
// lämnas orörda precis som förut — ingen regression, bara ofixat kvar.
export function Field({
  label,
  children,
  inputId,
}: {
  label: string;
  children: React.ReactNode;
  // Sätt bara om barnet INTE är ett direkt input/textarea/select (t.ex.
  // PasswordField, som lindar sitt input i en div för visa/dölj-knappen) —
  // ge samma id till det faktiska fältet själv då, se PasswordField nedan.
  inputId?: string;
}) {
  const generatedId = useId();
  const only = Children.count(children) === 1 ? Children.only(children) : null;
  const canAutoLabel = isValidElement(only) && typeof only.type === "string" && LABELABLE_TAGS.has(only.type);
  return (
    <div className="mb-4">
      <label htmlFor={inputId ?? (canAutoLabel ? generatedId : undefined)} className="text-sm font-medium mb-2 block">
        {label}
      </label>
      {inputId ? children : canAutoLabel ? cloneElement(only as ReactElement<{ id?: string }>, { id: generatedId }) : children}
    </div>
  );
}

export const inputClass = "w-full px-4 py-3 rounded-xl border border-line text-[15px]";

// Samma lösenordsfält återanvänds på fem ställen (registrering x2,
// inloggning, byt lösenord, återställ lösenord) — visa/dölj-knapp byggd
// en gång här istället för att upprepas i varje formulär.
export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <Field label={label} inputId={id}>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${inputClass} pr-11`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
          aria-label={visible ? "Dölj lösenord" : "Visa lösenord"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </Field>
  );
}

export function FormActions({
  valid,
  onSave,
  onCancel,
}: {
  valid: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  // Skydd mot dubbel-inskick vid snabba dubbelklick — de flesta av de här
  // formulären stänger/navigerar bort sig själva direkt vid en lyckad
  // spara, så den korta timeouten är bara ett skyddsnät för fall där
  // formuläret av någon anledning stannar kvar öppet.
  const [saving, setSaving] = useState(false);
  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    onSave();
    setTimeout(() => setSaving(false), 1000);
  };
  return (
    <div className="flex flex-col gap-2 mt-2">
      <button
        onClick={handleSave}
        disabled={!valid || saving}
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
