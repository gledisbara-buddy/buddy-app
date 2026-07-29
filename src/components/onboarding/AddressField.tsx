"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { searchAddress, type AddressMatch } from "@/lib/address-lookup";
import { Field, inputClass } from "@/components/onboarding/shared";

export type AddressValue = { adress: string; postnummer: string; ort: string };

export function AddressField({
  value,
  onChange,
  addressLabel = "Adress",
}: {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  addressLabel?: string;
}) {
  const [suggestions, setSuggestions] = useState<AddressMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const onAdressChange = (adress: string) => {
    onChange({ ...value, adress });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (adress.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddress(adress);
      setSuggestions(results);
      setOpen(true);
      setLoading(false);
    }, 200);
  };

  const selectSuggestion = (match: AddressMatch) => {
    onChange(match);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <>
      <Field label={addressLabel}>
        <div className="relative">
          <input
            className={inputClass}
            value={value.adress}
            onChange={(e) => onAdressChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Storgatan 4"
            autoComplete="off"
          />
          {loading && (
            <Loader2 size={15} className="bd-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate" />
          )}
          {open && suggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-line shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-frost border-b border-line last:border-b-0"
                >
                  <div className="font-medium">{s.adress}</div>
                  <div className="text-xs text-slate">
                    {s.postnummer} {s.ort}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Postnummer">
          <input
            className={inputClass}
            value={value.postnummer}
            onChange={(e) => onChange({ ...value, postnummer: e.target.value })}
            placeholder="123 45"
          />
        </Field>
        <Field label="Ort">
          <input
            className={inputClass}
            value={value.ort}
            onChange={(e) => onChange({ ...value, ort: e.target.value })}
            placeholder="Stockholm"
          />
        </Field>
      </div>
    </>
  );
}
