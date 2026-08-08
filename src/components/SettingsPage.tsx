"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Field, PillGroup } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";

export function SettingsPage() {
  const router = useRouter();
  const { userType, loading } = useBuddy();

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  const [emailNotis, setEmailNotis] = useState<"ja" | "nej" | null>("ja");
  const [smsNotis, setSmsNotis] = useState<"ja" | "nej" | null>("nej");
  const [sprak, setSprak] = useState<"sv" | "en" | null>("sv");
  const [saved, setSaved] = useState(false);

  if (loading || !userType) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-lg mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Ditt konto</span>
        <h1 className="bd-display text-3xl mt-2 mb-1">Inställningar</h1>
        <p className="text-sm mb-8 text-slate">Anpassa hur och när Buddy hör av sig.</p>

        <div className="bg-white rounded-2xl border border-line p-6">
          <Field label="Notiser via e-post">
            <PillGroup options={["ja", "nej"] as const} labels={{ ja: "Ja", nej: "Nej" }} value={emailNotis} onChange={setEmailNotis} />
          </Field>
          <Field label="Notiser via SMS">
            <PillGroup options={["ja", "nej"] as const} labels={{ ja: "Ja", nej: "Nej" }} value={smsNotis} onChange={setSmsNotis} />
          </Field>
          <Field label="Språk">
            <PillGroup options={["sv", "en"] as const} labels={{ sv: "Svenska", en: "English" }} value={sprak} onChange={setSprak} />
          </Field>

          <button
            onClick={handleSave}
            className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
          >
            {saved ? (
              <>
                Sparat <Check size={16} />
              </>
            ) : (
              "Spara ändringar"
            )}
          </button>
        </div>

        <p className="text-xs text-center mt-4 text-slate">
          Fler inställningar tillkommer efter hand.
        </p>
      </div>
    </div>
  );
}
