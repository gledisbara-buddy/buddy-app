"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CommentRow = { id: string; author_email: string; comment: string; created_at: string };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
}

// Interna kommentarer knutna till ETT specifikt ärende (bokning/skada) —
// skiljer sig från CustomerNotesTab.tsx som är skopat till hela kunden.
// Aldrig kundsynligt, samma princip som customer_notes (ingen kund-policy
// finns alls på case_comments, se schema.sql).
export function CaseComments({ caseType, caseId, actorEmail }: { caseType: "booking" | "claim"; caseId: string; actorEmail: string }) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("case_comments")
        .select("id, author_email, comment, created_at")
        .eq("case_type", caseType)
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });
      setComments((data ?? []) as CommentRow[]);
      setLoading(false);
    })();
  }, [caseType, caseId]);

  const addComment = async () => {
    if (draft.trim().length === 0) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("case_comments")
      .insert({ case_type: caseType, case_id: caseId, author_email: actorEmail, comment: draft.trim() })
      .select("id, author_email, comment, created_at")
      .single();
    setSaving(false);
    if (!error && data) {
      setComments((prev) => [...prev, data as CommentRow]);
      setDraft("");
    }
  };

  return (
    <div>
      <div className="text-xs mb-2 text-slate uppercase tracking-wide">Interna kommentarer</div>
      {loading ? (
        <p className="text-sm text-slate">Laddar…</p>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {comments.length === 0 && <p className="text-sm text-slate">Inga kommentarer på det här ärendet än.</p>}
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-frost-2 p-3">
              <div className="flex justify-between text-xs mb-1 text-slate">
                <span className="font-semibold text-ink">{c.author_email}</span>
                <span>{formatDateTime(c.created_at)}</span>
              </div>
              <p className="text-sm">{c.comment}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
          placeholder="Skriv en kommentar om det här ärendet…"
          className="flex-1 px-3 py-2 rounded-xl border border-line text-sm"
        />
        <button
          onClick={addComment}
          disabled={saving || draft.trim().length === 0}
          className="bd-btn px-3.5 rounded-xl font-semibold text-white text-sm bg-forest disabled:opacity-40"
        >
          Spara
        </button>
      </div>
    </div>
  );
}
