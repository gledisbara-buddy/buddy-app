"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardSignature, Download, FolderOpen } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { FullmaktSigning } from "@/components/FullmaktSigning";
import { useBuddy } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";

// Dokumentarkiv — samlar kundens dokument på ett ställe. Just nu bara
// fullmakten (den enda riktiga filen som finns i appen, se
// FullmaktSigning.tsx); fler dokumenttyper (avtalsbekräftelser m.m.)
// läggs till här den dagen de faktiskt genereras som riktiga filer,
// istället för att låtsas ha dokument som inte finns.
export function ArchiveView() {
  const router = useRouter();
  const { userType, loading, profile } = useBuddy();
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

  if (loading || !userType) return null;

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} showTabs />
      <div className="max-w-lg mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Ditt konto</span>
        <h1 className="bd-display text-3xl mt-2 mb-1">Dokumentarkiv</h1>
        <p className="text-sm mb-8 text-slate">Dina dokument hos Buddy, samlade på ett ställe.</p>

        <div className="bg-white rounded-2xl border border-line p-6">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardSignature size={16} className="text-forest" />
            <h2 className="font-semibold text-[15px]">Fullmakt</h2>
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

        {!profile?.fullmaktSignedAt && !showSigning && (
          <div className="flex flex-col items-center text-center gap-3 py-10 mt-2">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-frost-2">
              <FolderOpen size={18} className="text-forest" />
            </div>
            <p className="text-xs text-slate max-w-[280px]">
              Fler dokument, som avtalsbekräftelser, dyker upp här allt eftersom du tecknar avtal via Buddy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
