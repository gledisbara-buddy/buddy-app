"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardSignature, Download, FolderOpen, History } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { PageSkeleton } from "@/components/PageSkeleton";
import { FullmaktSigning } from "@/components/FullmaktSigning";
import { useBuddy } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";

type FullmaktHistoryRow = { pdf_path: string; signed_at: string };

function formatSignedAt(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" });
}

// Dokumentarkiv — samlar kundens dokument på ett ställe. Just nu bara
// fullmakten (den enda riktiga filen som finns i appen, se
// FullmaktSigning.tsx); fler dokumenttyper (avtalsbekräftelser m.m.)
// läggs till här den dagen de faktiskt genereras som riktiga filer,
// istället för att låtsas ha dokument som inte finns.
export function ArchiveView() {
  const router = useRouter();
  const { userType, loading, userId, profile } = useBuddy();
  const [showSigning, setShowSigning] = useState(false);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [history, setHistory] = useState<FullmaktHistoryRow[]>([]);

  const handleDownload = async (path: string | undefined) => {
    if (!path) return;
    setDownloadingPath(path);
    const supabase = createClient();
    const { data } = await supabase.storage.from("fullmakter").createSignedUrl(path, 300);
    setDownloadingPath(null);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  // Tidigare signeringar (se fullmakt_history i schema.sql) — bara
  // relevant om fullmakten någonsin signerats, och bara en historik om
  // kunden faktiskt signerat om den minst en gång.
  useEffect(() => {
    if (!userId || !profile?.fullmaktSignedAt) return;
    const supabase = createClient();
    supabase
      .from("fullmakt_history")
      .select("pdf_path, signed_at")
      .eq("user_id", userId)
      .order("signed_at", { ascending: false })
      .then(({ data }) => setHistory((data ?? []) as FullmaktHistoryRow[]));
  }, [userId, profile?.fullmaktSignedAt]);

  if (loading) return <PageSkeleton />;
  if (!userType) return null;

  const priorSignings = history.filter((h) => h.pdf_path !== profile?.fullmaktPdfPath);

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

          {showSigning ? (
            <div className="mt-4">
              <FullmaktSigning onDone={() => setShowSigning(false)} onSkip={() => setShowSigning(false)} />
            </div>
          ) : profile?.fullmaktSignedAt ? (
            <>
              <p className="text-sm mb-4 text-slate">Signerad {formatSignedAt(profile.fullmaktSignedAt)}.</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleDownload(profile.fullmaktPdfPath)}
                  disabled={downloadingPath === profile.fullmaktPdfPath}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-line text-sm font-medium disabled:opacity-50"
                >
                  <Download size={15} /> {downloadingPath === profile.fullmaktPdfPath ? "Hämtar…" : "Ladda ner PDF"}
                </button>
                <button onClick={() => setShowSigning(true)} className="text-sm font-semibold text-forest">
                  Signera om fullmakten
                </button>
              </div>
            </>
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

        {profile?.fullmaktSignedAt && !showSigning && priorSignings.length > 0 && (
          <div className="bg-white rounded-2xl border border-line p-6 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <History size={16} className="text-forest" />
              <h2 className="font-semibold text-[15px]">Tidigare signeringar</h2>
            </div>
            <div className="flex flex-col divide-y divide-line">
              {priorSignings.map((row) => (
                <div key={row.pdf_path} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="text-sm text-slate">{formatSignedAt(row.signed_at)}</span>
                  <button
                    onClick={() => handleDownload(row.pdf_path)}
                    disabled={downloadingPath === row.pdf_path}
                    className="flex items-center gap-1.5 text-xs font-semibold text-forest flex-none disabled:opacity-50"
                  >
                    <Download size={13} /> {downloadingPath === row.pdf_path ? "Hämtar…" : "Ladda ner"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
