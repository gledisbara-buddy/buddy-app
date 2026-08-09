"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "enroll" | "challenge" | "ready";

// Internverktyget har full åtkomst till personnummer, signerade
// fullmakts-PDF:er och kunddata för alla kunder — därför krävs en
// verifierad TOTP-faktor (Supabase Auths inbyggda MFA) innan innehållet
// visas, oavsett hur många anställda kontot i övrigt delas mellan.
export function MfaGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        setStatus("ready");
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setStatus("challenge");
        return;
      }
      // Tidigare avbrutna registreringsförsök lämnar overifierade faktorer
      // kvar. Städa bort dem (bästa försök — spelar ingen roll om det
      // misslyckas) och ge den nya faktorn ett unikt namn, så att en
      // krock med "friendly name already exists" aldrig kan blockera en
      // ny registrering oavsett hur städningen går.
      const staleTotps = factors?.all?.filter((f) => f.factor_type === "totp" && f.status === "unverified") ?? [];
      await Promise.all(staleTotps.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })));
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `internt-${Date.now()}`,
      });
      if (enrollError || !data) {
        setError(enrollError?.message ?? "Kunde inte starta tvåfaktorsregistrering.");
        setStatus("enroll");
        return;
      }
      setFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStatus("enroll");
    })();
  }, []);

  const submitEnrollCode = async () => {
    if (!factorId || code.trim().length < 6) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setError("Kunde inte verifiera koden. Försök igen.");
      setSubmitting(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setSubmitting(false);
    if (verifyError) {
      setError("Fel kod — kolla att klockan i appen och telefonen stämmer, och försök igen.");
      return;
    }
    setStatus("ready");
  };

  const submitChallengeCode = async () => {
    if (!factorId || code.trim().length < 6) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setError("Kunde inte skicka koden. Försök igen.");
      setSubmitting(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setSubmitting(false);
    if (verifyError) {
      setError("Fel kod. Försök igen.");
      return;
    }
    setStatus("ready");
  };

  if (status === "checking") return null;

  if (status === "ready") return <>{children}</>;

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-5">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-line p-6">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-frost-2">
          <ShieldCheck size={20} className="text-forest" />
        </div>
        {status === "enroll" ? (
          <>
            <div className="font-semibold text-[17px] mb-1.5">Sätt upp tvåfaktorsinloggning</div>
            <p className="text-sm text-slate mb-4">
              Internverktyget innehåller kunduppgifter och kräver en autentiseringsapp (t.ex. Google Authenticator eller
              1Password). Skanna koden nedan.
            </p>
            {qrSvg && (
              // eslint-disable-next-line @next/next/no-img-element -- data: URI, next/image kan inte optimera det ändå
              <img src={qrSvg} alt="QR-kod för tvåfaktorsinloggning" className="w-40 h-40 mx-auto mb-3" />
            )}
            {secret && (
              <p className="text-xs text-center mb-4 text-slate break-all">
                Går inte att skanna? Skriv in koden manuellt: <span className="font-mono">{secret}</span>
              </p>
            )}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6 siffror från appen"
              inputMode="numeric"
              className="w-full px-4 py-3 rounded-xl border border-line text-[15px] mb-3 text-center tracking-widest"
            />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <button
              onClick={submitEnrollCode}
              disabled={submitting || code.trim().length < 6}
              className="bd-btn w-full py-3 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
            >
              Bekräfta och aktivera
            </button>
          </>
        ) : (
          <>
            <div className="font-semibold text-[17px] mb-1.5">Ange din kod</div>
            <p className="text-sm text-slate mb-4">Öppna din autentiseringsapp och ange den aktuella 6-siffriga koden.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6 siffror från appen"
              inputMode="numeric"
              className="w-full px-4 py-3 rounded-xl border border-line text-[15px] mb-3 text-center tracking-widest"
            />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <button
              onClick={submitChallengeCode}
              disabled={submitting || code.trim().length < 6}
              className="bd-btn w-full py-3 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
            >
              Logga in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
