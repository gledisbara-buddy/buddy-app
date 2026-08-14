"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, FolderOpen } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Field, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";

export function ProfilePage() {
  const router = useRouter();
  const { userType, loading, profile, updateProfile } = useBuddy();

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  const [name, setName] = useState(profile?.name ?? "");
  const [personnummer, setPersonnummer] = useState(profile?.personnummer ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saved, setSaved] = useState(false);
  const [syncedLoading, setSyncedLoading] = useState(loading);

  // profile laddas asynkront från Supabase, så formuläret måste synkas om
  // en gång när det blir klart — useState:s initialvärde fångas annars bara
  // vid första renderingen (då profile fortfarande är null). Justeras under
  // rendering (samma mönster som NeedsAnalysis.tsx), inte i en effekt.
  if (loading !== syncedLoading) {
    setSyncedLoading(loading);
    if (!loading && profile) {
      setName(profile.name);
      setPersonnummer(profile.personnummer ?? "");
      setPhone(profile.phone ?? "");
    }
  }

  if (loading || !userType) return null;

  const idLabel = userType === "foretag" ? "Organisationsnummer" : "Personnummer";

  const handleSave = () => {
    updateProfile({
      name: name.trim(),
      personnummer: personnummer.trim() || null,
      phone: phone.trim() || null,
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
              className={`${inputClass} bg-slate-50 opacity-60 cursor-not-allowed`}
              value={profile?.email ?? ""}
              disabled
              readOnly
            />
            <p className="text-xs mt-1.5 text-slate">
              Det här är din inloggningsmejl. Kontakta kundtjänst om du vill byta den.
            </p>
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

        <button
          onClick={() => router.push("/arkiv")}
          className="w-full flex items-center gap-3 bg-white rounded-2xl border border-line p-6 mt-6 text-left hover:bg-frost"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
            <FolderOpen size={16} className="text-forest" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px]">Dokumentarkiv</div>
            <div className="text-xs text-slate">Fullmakt och andra dokument från Buddy</div>
          </div>
          <ArrowRight size={16} className="text-slate flex-none" />
        </button>
      </div>
    </div>
  );
}
