"use client";

import { useEffect } from "react";

export function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="bd-scrim fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "var(--color-scrim)" }}
      onClick={onClose}
    >
      <div
        className="bd-fade w-full max-w-sm bg-white rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// Delad bekräftelsedialog för destruktiva/avbrytande handlingar (radera en
// sak, lämna en påbörjad skadeanmälan) — så varje ställe inte bygger sin
// egen modal för samma mönster.
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = true,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <Overlay onClose={onCancel}>
      <h2 className="bd-display text-xl mb-2">{title}</h2>
      <p className="text-sm mb-6 text-slate">{body}</p>
      <div className="flex flex-col gap-2">
        <button
          onClick={onConfirm}
          className={`bd-btn w-full py-3 rounded-full font-semibold text-white text-[15px] ${danger ? "bg-red-500" : "bg-forest"}`}
        >
          {confirmLabel}
        </button>
        <button onClick={onCancel} className="w-full py-3 rounded-full font-semibold text-[15px] text-slate">
          Avbryt
        </button>
      </div>
    </Overlay>
  );
}
