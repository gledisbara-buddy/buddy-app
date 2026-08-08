"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Field, inputClass } from "@/components/onboarding/shared";
import { createClient } from "@/lib/supabase/client";

// Två lägen på samma sida: en begär en återställningslänk via mejl, den
// andra (efter att man klickat länken, som ger en tillfällig session) sätter
// ett nytt lösenord. Supabase talar om vilket läge via PASSWORD_RECOVERY-eventet.
export function ResetPasswordView() {
  const router = useRouter();
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const requestLink = async () => {
    if (email.trim().length < 3 || loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/aterstall-losenord`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  const setNewPassword = async () => {
    if (password.length < 6 || loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-between px-6 py-5">
        <Logo />
        <div />
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md bd-fade">
          {!recoveryMode && !sent && (
            <button
              onClick={() => router.push("/kom-igang")}
              className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
            >
              <ArrowLeft size={15} /> Tillbaka
            </button>
          )}

          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-forest mx-auto mb-4">
                <Check size={26} color="white" />
              </div>
              <h1 className="bd-display text-2xl mb-2">Lösenordet är uppdaterat</h1>
              <button
                onClick={() => router.push("/dashboard")}
                className="bd-btn mt-4 px-6 py-3 rounded-full font-semibold text-white text-[15px] bg-forest"
              >
                Till översikten
              </button>
            </div>
          ) : recoveryMode ? (
            <>
              <div className="text-center mb-7">
                <span className="bd-eyebrow">Nytt lösenord</span>
                <h1 className="bd-display text-3xl mt-3 mb-2">Välj ett nytt lösenord</h1>
              </div>
              <div className="bg-white rounded-2xl border border-line p-6">
                <Field label="Nytt lösenord">
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minst 6 tecken"
                  />
                </Field>
                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                <button
                  onClick={setNewPassword}
                  disabled={password.length < 6 || loading}
                  className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
                >
                  {loading ? <Loader2 size={17} className="bd-spin" /> : "Spara nytt lösenord"}
                </button>
              </div>
            </>
          ) : sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-forest mx-auto mb-4">
                <Mail size={26} color="white" />
              </div>
              <h1 className="bd-display text-2xl mb-2">Kolla din mejl</h1>
              <p className="text-sm text-slate">Vi har skickat en återställningslänk till {email.trim()}.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <span className="bd-eyebrow">Glömt lösenordet</span>
                <h1 className="bd-display text-3xl mt-3 mb-2">Återställ lösenord</h1>
                <p className="text-sm text-slate">Vi skickar en länk till din e-post.</p>
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
                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                <button
                  onClick={requestLink}
                  disabled={email.trim().length < 3 || loading}
                  className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
                >
                  {loading ? <Loader2 size={17} className="bd-spin" /> : "Skicka länk"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
