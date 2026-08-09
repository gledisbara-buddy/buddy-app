"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Check, Eraser, Loader2, ShieldAlert } from "lucide-react";
import { useBuddy } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";
import { FULLMAKT_DRAFT_NOTICE, FULLMAKT_PARAGRAPHS, buildFullmaktPdf } from "@/lib/fullmakt";

export function FullmaktSigning({
  name,
  personnummer,
  onDone,
  onSkip,
}: {
  // Onboarding har inte sparat namnet till profilen ännu vid det här
  // steget, så det skickas in explicit där. CompareFlow (Del 3) kan
  // istället luta sig på profile?.name/-personnummer via default-värdena.
  name?: string;
  personnummer?: string;
  onDone: () => void;
  onSkip?: () => void;
}) {
  const { profile, userId, recordFullmaktSigned } = useBuddy();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = name ?? profile?.name ?? "";
  const displayPersonnummer = personnummer ?? profile?.personnummer;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, { backgroundColor: "#ffffff", penColor: "#12241c" });
    padRef.current = pad;
    pad.addEventListener("endStroke", () => setHasSignature(!pad.isEmpty()));

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const wasEmpty = pad.isEmpty();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      if (wasEmpty) pad.clear();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.off();
    };
  }, []);

  const handleClear = () => {
    padRef.current?.clear();
    setHasSignature(false);
  };

  const handleSign = async () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty() || !userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const signatureDataUrl = pad.toDataURL("image/png");
      const pdfBytes = await buildFullmaktPdf({
        name: displayName,
        personnummer: displayPersonnummer,
        signatureDataUrl,
        signedAt: new Date(),
      });
      const path = `${userId}/fullmakt.pdf`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("fullmakter")
        .upload(path, new Blob([pdfBytes as BlobPart], { type: "application/pdf" }), {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadError) {
        setError("Kunde inte spara fullmakten just nu. Försök igen om en stund.");
        setSubmitting(false);
        return;
      }
      recordFullmaktSigned(path);
      onDone();
    } catch {
      setError("Något gick fel när fullmakten skulle skapas. Försök igen.");
      setSubmitting(false);
    }
  };

  return (
    <div className="bd-fade">
      <span className="bd-eyebrow">Fullmakt</span>
      <h1 className="bd-display text-2xl mt-3 mb-2">Ge Buddy fullmakt att hjälpa dig</h1>
      <p className="text-sm mb-4 text-slate">
        Det här ger Buddy rätt att teckna, säga upp och hantera skadereglering å dina vägnar —
        alltid bara när du själv bett om det. Du kan återkalla fullmakten när som helst.
      </p>

      <div className="rounded-2xl border border-line bg-white p-4 mb-3 max-h-56 overflow-y-auto bd-scroll">
        {FULLMAKT_PARAGRAPHS.map((p, i) => (
          <p key={i} className="text-sm mb-3 last:mb-0 text-ink" style={{ lineHeight: 1.6 }}>
            {p}
          </p>
        ))}
      </div>

      <div className="rounded-2xl p-4 mb-5 flex items-start gap-3 bg-frost-2">
        <ShieldAlert size={16} className="flex-none mt-0.5 text-forest" />
        <p className="text-xs text-slate" style={{ lineHeight: 1.5 }}>
          {FULLMAKT_DRAFT_NOTICE}
        </p>
      </div>

      <label className="text-sm font-medium mb-2 block">Signera med fingret eller musen</label>
      <div className="rounded-2xl border border-line overflow-hidden mb-2" style={{ touchAction: "none" }}>
        <canvas ref={canvasRef} className="w-full block" style={{ height: 160 }} />
      </div>
      <button
        onClick={handleClear}
        disabled={!hasSignature || submitting}
        className="flex items-center gap-1.5 text-xs font-medium mb-5 opacity-60 hover:opacity-100 disabled:opacity-30"
      >
        <Eraser size={13} /> Rensa signatur
      </button>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        onClick={handleSign}
        disabled={!hasSignature || submitting}
        className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
      >
        {submitting ? <Loader2 size={17} className="bd-spin" /> : <Check size={17} />}
        Signera fullmakt
      </button>
      {onSkip && (
        <button onClick={onSkip} disabled={submitting} className="w-full text-sm font-semibold py-3 text-slate">
          Hoppa över, signera senare
        </button>
      )}
    </div>
  );
}
