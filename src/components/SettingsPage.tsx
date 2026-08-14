"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Download } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ConfirmDialog } from "@/components/Overlay";
import { Field, PillGroup } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";

export function SettingsPage() {
  const router = useRouter();
  const {
    userType,
    loading,
    profile,
    items,
    policies,
    bookings,
    claims,
    household,
    referralStats,
    accountDeletionRequested,
    submitAccountDeletionRequest,
  } = useBuddy();
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const handleExport = () => {
    const exportData = {
      exporterat: new Date().toISOString(),
      profil: profile,
      saker: items,
      avtal: policies,
      hushall: household,
      bokningar: bookings,
      skadeanmalningar: claims,
      varvning: referralStats,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mina-uppgifter-buddy.json";
    a.click();
    URL.revokeObjectURL(url);
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

        <div className="bg-white rounded-2xl border border-line p-6 mt-6">
          <h2 className="font-semibold text-[15px] mb-1">Dina uppgifter</h2>
          <p className="text-sm mb-4 text-slate">
            Ladda ner allt Buddy vet om dig, eller begär att ditt konto och dina uppgifter raderas.
          </p>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-line text-sm font-medium mb-3"
          >
            <Download size={15} /> Exportera min data
          </button>

          {accountDeletionRequested ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-frost-2 text-sm text-slate justify-center">
              <Check size={15} className="text-forest flex-none" /> Raderingsbegäran skickad — hanteras av Buddy
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium text-red-600"
              style={{ borderColor: "var(--color-line)" }}
            >
              <AlertTriangle size={15} /> Radera mitt konto
            </button>
          )}
        </div>

        {confirmDelete && (
          <ConfirmDialog
            title="Radera ditt konto?"
            body="Buddy tar bort dina uppgifter och avslutar kontot. En anställd hanterar begäran manuellt — det går inte att ångra när det är klart."
            confirmLabel="Skicka raderingsbegäran"
            onConfirm={() => {
              submitAccountDeletionRequest();
              setConfirmDelete(false);
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>
    </div>
  );
}
