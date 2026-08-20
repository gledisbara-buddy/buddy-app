"use client";

import { useEffect, useState } from "react";
import { ClipboardSignature, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FullmaktHistoryRow = { pdf_path: string; signed_at: string };

function formatSignedAt(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" });
}

// Kundens dokument, sett från internverktyget — just nu bara signerade
// fullmakter (samma "fullmakter"-bucket som ArchiveView.tsx läser på
// kundsidan; RLS:en tillåter redan anställda att läsa vilken kunds
// fullmakt som helst, se fullmakt_select_own_or_employee i schema.sql).
// Fler dokumenttyper läggs till den dagen de faktiskt finns som riktiga
// filer, samma princip som ArchiveView.tsx följer.
export function CustomerDocumentsTab({ customerId }: { customerId: string }) {
  const [history, setHistory] = useState<FullmaktHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("fullmakt_history")
        .select("pdf_path, signed_at")
        .eq("user_id", customerId)
        .order("signed_at", { ascending: false });
      setHistory((data ?? []) as FullmaktHistoryRow[]);
      setLoading(false);
    })();
  }, [customerId]);

  const handleDownload = async (path: string) => {
    setDownloadingPath(path);
    const supabase = createClient();
    const { data } = await supabase.storage.from("fullmakter").createSignedUrl(path, 300);
    setDownloadingPath(null);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (history.length === 0) return <p className="text-sm text-slate">Inga dokument registrerade för den här kunden.</p>;

  return (
    <div className="flex flex-col gap-3">
      {history.map((h) => (
        <div key={h.pdf_path} className="bg-white rounded-2xl border border-line p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-frost-2">
            <ClipboardSignature size={15} className="text-forest" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Fullmakt</div>
            <div className="text-xs text-slate">Signerad {formatSignedAt(h.signed_at)}</div>
          </div>
          <button
            onClick={() => handleDownload(h.pdf_path)}
            disabled={downloadingPath === h.pdf_path}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-line text-forest flex-none disabled:opacity-50"
          >
            <Download size={13} /> {downloadingPath === h.pdf_path ? "Hämtar…" : "Ladda ner"}
          </button>
        </div>
      ))}
    </div>
  );
}
