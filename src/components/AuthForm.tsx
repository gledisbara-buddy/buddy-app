"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Field, inputClass, PasswordField } from "@/components/onboarding/shared";
import { createClient } from "@/lib/supabase/client";
import { isValidSwedishMobile } from "@/lib/phone";
import { isValidPersonnummer } from "@/lib/personnummer";
import { translateAuthError } from "@/lib/auth-errors";
import type { UserType } from "@/lib/types";

type Mode = "login" | "signup";

export function AuthForm({ userType, initialReferralCode }: { userType: UserType; initialReferralCode?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [personnummer, setPersonnummer] = useState("");
  // Förifylld från en delad värvningslänk (?ref=KOD), men går fortfarande
  // att ändra eller tömma om vännen vill skriva in en annan kod själv.
  const [referralCode, setReferralCode] = useState(initialReferralCode?.trim().toUpperCase() ?? "");
  const cameFromReferralLink = !!initialReferralCode?.trim();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [triedSubmit, setTriedSubmit] = useState(false);

  // Namngivna delkrav istället för en enda bool — så knappen kan förklara
  // exakt vad som saknas istället för att bara vara gråmarkerad. Visas
  // bara efter ett försök (triedSubmit), inte som en röd vägg redan vid
  // första blicken på ett tomt formulär.
  const missingReasons: string[] = [];
  if (email.trim().length <= 3) missingReasons.push("en giltig e-postadress");
  if (password.length < 6) missingReasons.push("ett lösenord på minst 6 tecken");
  if (mode === "signup") {
    if (name.trim().length < 2) missingReasons.push("förnamn");
    if (lastName.trim().length < 2) missingReasons.push("efternamn");
    if (!isValidSwedishMobile(phone)) missingReasons.push("ett giltigt mobilnummer");
    if (!isValidPersonnummer(personnummer)) missingReasons.push("ett giltigt personnummer");
    if (password.length >= 6 && confirmPassword !== password) missingReasons.push("lösenorden måste matcha");
  }
  const valid = missingReasons.length === 0;

  const handleSubmit = async () => {
    if (loading) return;
    if (!valid) {
      setTriedSubmit(true);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            user_type: userType,
            referral_code_used: referralCode.trim() || null,
            phone: phone.trim(),
            name: `${name.trim()} ${lastName.trim()}`.trim(),
            personnummer: personnummer.trim(),
          },
        },
      });
      setLoading(false);
      if (signUpError) {
        setError(translateAuthError(signUpError.message));
        return;
      }
      if (!data.session) {
        // E-postbekräftelse är påslaget i Supabase-projektet — inget att
        // logga in med förrän länken i mejlet har klickats.
        setCheckInbox(true);
        return;
      }
      router.push("/dashboard?intro=1");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (signInError) {
        setError(translateAuthError(signInError.message));
        return;
      }
      router.push("/dashboard");
    }
  };

  const handleVerifyCode = async () => {
    if (code.trim().length < 6 || verifying) return;
    setVerifying(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "signup",
    });
    setVerifying(false);
    if (verifyError) {
      setError("Fel kod, eller så har den gått ut. Kontrollera koden eller skicka en ny.");
      return;
    }
    router.push("/dashboard?intro=1");
  };

  const handleResendCode = async () => {
    setError(null);
    setResendMessage(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setResendMessage(resendError ? "Kunde inte skicka en ny kod just nu." : "Ny kod skickad.");
  };

  if (checkInbox) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-between px-6 py-5">
          <Logo />
          <div />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 pb-16">
          <div className="w-full max-w-md text-center bd-fade">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-forest mx-auto mb-4">
              <Mail size={26} color="white" />
            </div>
            <h1 className="bd-display text-2xl mb-2">Bekräfta din mejladress</h1>
            <p className="text-sm text-slate mb-6">
              Vi har skickat en 6-siffrig kod till {email.trim()}. Ange den nedan för att aktivera kontot.
            </p>
            <div className="bg-white rounded-2xl border border-line p-6 text-left">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6 siffror"
                aria-label="Bekräftelsekod"
                inputMode="numeric"
                className={`${inputClass} mb-4 text-center tracking-widest`}
              />
              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
              {resendMessage && <p className="text-sm mb-4 text-slate">{resendMessage}</p>}
              <button
                onClick={handleVerifyCode}
                disabled={code.trim().length < 6 || verifying}
                className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50 mb-3"
              >
                {verifying ? <Loader2 size={17} className="bd-spin" /> : <><Check size={17} /> Bekräfta</>}
              </button>
              <button onClick={handleResendCode} className="w-full text-center text-sm text-slate hover:text-ink">
                Fick du ingen kod? Skicka igen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-between px-6 py-5">
        <Logo />
        <div />
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md bd-fade">
          <button
            onClick={() => router.push("/kom-igang")}
            className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
          >
            <ArrowLeft size={15} /> Tillbaka
          </button>
          <div className="text-center mb-7">
            <span className="bd-eyebrow">{mode === "signup" ? "Skapa konto" : "Logga in"}</span>
            <h1 className="bd-display text-3xl mt-3 mb-2">
              {mode === "signup" ? "Skapa ditt konto" : "Välkommen tillbaka"}
            </h1>
            <p className="text-sm text-slate">
              {userType === "foretag" ? "Konto för ditt företag." : "Med e-post och lösenord."}
            </p>
          </div>
          {mode === "signup" && cameFromReferralLink && (
            <div className="rounded-2xl p-4 mb-4 text-sm text-center bg-frost-2 text-ink">
              Du blev inbjuden med kod <b>{initialReferralCode?.trim().toUpperCase()}</b> — den är redan ifylld nedan.
            </div>
          )}
          <div className="bg-white rounded-2xl border border-line p-6">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Förnamn">
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="T.ex. Sam"
                  />
                </Field>
                <Field label="Efternamn">
                  <input
                    className={inputClass}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="T.ex. Andersson"
                  />
                </Field>
              </div>
            )}
            <Field label="E-post">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sam@exempel.se"
              />
            </Field>
            <PasswordField label="Lösenord" value={password} onChange={setPassword} placeholder="Minst 6 tecken" />
            {mode === "signup" && (
              <PasswordField
                label="Bekräfta lösenord"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Upprepa lösenordet"
              />
            )}
            {mode === "signup" && (
              <Field label="Mobilnummer">
                <input
                  type="tel"
                  inputMode="tel"
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="070-123 45 67"
                />
              </Field>
            )}
            {mode === "signup" && (
              <Field label="Personnummer">
                <input
                  className={inputClass}
                  value={personnummer}
                  onChange={(e) => setPersonnummer(e.target.value)}
                  placeholder="ÅÅÅÅMMDD-XXXX"
                />
              </Field>
            )}
            {mode === "signup" && (
              <Field label="Värvningskod (valfritt)">
                <input
                  className={inputClass}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="T.ex. SAM1234"
                />
              </Field>
            )}

            {triedSubmit && missingReasons.length > 0 && (
              <p className="text-sm mb-4 text-amber-deep">
                Du behöver ange {missingReasons.join(", ")} innan du kan {mode === "signup" ? "skapa kontot" : "logga in"}.
              </p>
            )}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={17} className="bd-spin" />
              ) : (
                <>
                  <Check size={17} /> {mode === "signup" ? "Skapa konto" : "Logga in"}
                </>
              )}
            </button>

            {mode === "login" && (
              <Link href="/aterstall-losenord" className="block text-center text-xs mt-4 text-slate hover:text-ink">
                Glömt lösenordet?
              </Link>
            )}
          </div>
          <button
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError(null);
              setTriedSubmit(false);
            }}
            className="w-full text-center text-sm mt-5 text-slate hover:text-ink"
          >
            {mode === "signup" ? "Har du redan ett konto? Logga in" : "Nytt hos Buddy? Skapa konto"}
          </button>
        </div>
      </div>
    </div>
  );
}
