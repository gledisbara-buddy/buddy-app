"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardSignature, Download } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { FullmaktSigning } from "@/components/FullmaktSigning";
import { Field, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";

export function ProfilePage() {
  const router = useRouter();
  const { userType, loading, profile, updateProfile } = useBuddy();
  const [showSigning, setShowSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!profile?.fullmaktPdfPath) return;
    setDownloading(true);
    const supabase = createClient();
    const { data } = await supabase.storage.from("fullmakter").createSignedUrl(profile.fullmaktPdfPath, 300);
    setDownloading(false);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

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
      personnummer: personnummer.trim() || undefined,
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

        <div className="bg-white rounded-2xl border border-line p-6 mt-6">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardSignature size={16} className="text-forest" />
            <h2 className="font-semibold text-[15px]">Din fullmakt</h2>
          </div>

          {profile?.fullmaktSignedAt ? (
            <>
              <p className="text-sm mb-4 text-slate">
                Signerad{" "}
                {new Date(profile.fullmaktSignedAt).toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" })}.
              </p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-line text-sm font-medium disabled:opacity-50"
              >
                <Download size={15} /> {downloading ? "Hämtar…" : "Ladda ner PDF"}
              </button>
            </>
          ) : showSigning ? (
            <div className="mt-4">
              <FullmaktSigning onDone={() => setShowSigning(false)} onSkip={() => setShowSigning(false)} />
            </div>
          ) : (
            <>
              <p className="text-sm mb-4 text-slate">
                Du har inte signerat någon fullmakt än. Den behövs för att Buddy ska kunna teckna, säga upp
                och hjälpa till med skadereglering å dina vägnar.
              </p>
              <button
                onClick={() => setShowSigning(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium bg-forest"
              >
                Signera fullmakt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
