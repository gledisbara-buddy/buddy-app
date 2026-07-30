"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Field, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";

export function ProfilePage() {
  const router = useRouter();
  const { userType, profile, updateProfile } = useBuddy();

  useEffect(() => {
    if (!userType) router.replace("/kom-igang");
  }, [userType, router]);

  const [name, setName] = useState(profile?.name ?? "");
  const [personnummer, setPersonnummer] = useState(profile?.personnummer ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saved, setSaved] = useState(false);

  if (!userType) return null;

  const idLabel = userType === "foretag" ? "Organisationsnummer" : "Personnummer";

  const handleSave = () => {
    updateProfile({
      name: name.trim(),
      personnummer: personnummer.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-lg mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Ditt konto</span>
        <h1 className="bd-display text-3xl mt-2 mb-1">Min profil</h1>
        <p className="text-sm mb-8 text-slate">
          Uppgifterna används för att kontakta dig och för att fylla i dina ärenden korrekt.
        </p>

        <div className="bg-white rounded-2xl border border-line p-6">
          <Field label="Namn">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="T.ex. Sam" />
          </Field>
          <Field label={idLabel}>
            <input
              className={inputClass}
              value={personnummer}
              onChange={(e) => setPersonnummer(e.target.value)}
              placeholder={userType === "foretag" ? "556677-8899" : "ÅÅÅÅMMDD-XXXX"}
            />
          </Field>
          <Field label="E-post">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sam@exempel.se"
            />
          </Field>
          <Field label="Telefonnummer">
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="070-123 45 67"
            />
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
      </div>
    </div>
  );
}
