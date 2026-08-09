"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Field, inputClass } from "@/components/onboarding/shared";
import { createClient } from "@/lib/supabase/client";
import type { UserType } from "@/lib/types";

type Mode = "login" | "signup";

export function AuthForm({ userType }: { userType: UserType }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);

  const valid = email.trim().length > 3 && password.length >= 6;

  const handleSubmit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { user_type: userType, referral_code_used: referralCode.trim() || null } },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        // E-postbekräftelse är påslaget i Supabase-projektet — inget att
        // logga in med förrän länken i mejlet har klickats.
        setCheckInbox(true);
        return;
      }
      router.push("/onboarding");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/dashboard");
    }
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
            <h1 className="bd-display text-2xl mb-2">Kolla din mejl</h1>
            <p className="text-sm text-slate">
              Vi har skickat en bekräftelselänk till {email.trim()}. Klicka på den för att aktivera kontot.
            </p>
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
          <div className="bg-white rounded-2xl border border-line p-6">
            <Field label="E-post">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sam@exempel.se"
              />
            </Field>
            <Field label="Lösenord">
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 6 tecken"
              />
            </Field>
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

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!valid || loading}
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
