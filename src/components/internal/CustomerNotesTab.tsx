"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NoteRow = { id: string; author_email: string; body: string; created_at: string };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" });
}

// Interna anteckningar — syns aldrig för kunden själv (ingen kund-policy
// finns alls på customer_notes, se supabase/schema.sql). Går inte att
// ändra eller radera i efterhand, bara lägga till nya.
export function CustomerNotesTab({ customerId, actorEmail }: { customerId: string; actorEmail: string }) {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("customer_notes")
        .select("id, author_email, body, created_at")
        .eq("user_id", customerId)
        .order("created_at", { ascending: false });
      setNotes((data ?? []) as NoteRow[]);
      setLoading(false);
    })();
  }, [customerId]);

  const addNote = async () => {
    if (draft.trim().length === 0) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customer_notes")
      .insert({ user_id: customerId, author_email: actorEmail, body: draft.trim() })
      .select("id, author_email, body, created_at")
      .single();
    setSaving(false);
    if (!error && data) {
      setNotes((prev) => [data as NoteRow, ...prev]);
      setDraft("");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Skriv en anteckning om kunden…"
          rows={2}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-line text-sm resize-none"
        />
        <button
          onClick={addNote}
          disabled={saving || draft.trim().length === 0}
          className="bd-btn px-4 rounded-xl font-semibold text-white text-sm bg-forest disabled:opacity-40"
        >
          Spara
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate">Laddar…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate">Inga anteckningar än.</p>
      ) : (
        notes.map((n) => (
          <div key={n.id} className="bg-white rounded-2xl border border-line p-4">
            <div className="flex justify-between text-xs mb-1.5 text-slate">
              <span className="font-semibold text-ink">{n.author_email}</span>
              <span>{formatDateTime(n.created_at)}</span>
            </div>
            <p className="text-sm">{n.body}</p>
          </div>
        ))
      )}
    </div>
  );
}
