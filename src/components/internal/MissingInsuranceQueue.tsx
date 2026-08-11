"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveField } from "@/lib/activity-log";
import { createItemId, ITEM_CATEGORIES, FORSAKRINGSBOLAG, type ItemKind } from "@/lib/items";
import { synthesizeItem, type FetchableKind } from "@/lib/policy-fetch";

type RequestRow = { id: string; user_id: string; kind: string; note: string | null; status: string; created_at: string };
type ProfileLookup = { id: string; name: string; email: string | null };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

// Samlad kö över ALLA kunders flaggade "saknade" försäkringar (från
// BankIdImport.tsx), motsvarande CancellationQueue.tsx:s mönster —
// en anställd öppnar ett ärende, fyller i bolag/pris och den riktiga
// posten dyker upp på kundens Försäkringar-sektion.
export function MissingInsuranceQueue({
  actorEmail,
  onOpenCustomer,
}: {
  actorEmail: string;
  onOpenCustomer: (customerId: string) => void;
}) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLookup>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [bolag, setBolag] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const { data: requestRows } = await supabase
        .from("missing_insurance_requests")
        .select("id, user_id, kind, note, status, created_at")
        .eq("status", "ny")
        .order("created_at", { ascending: false });
      const rows = (requestRows ?? []) as RequestRow[];
      setRequests(rows);

      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profileRows } =
        userIds.length > 0
          ? await supabase.from("profiles").select("id, name, email").in("id", userIds)
          : { data: [] as ProfileLookup[] };
      setProfilesById(Object.fromEntries(((profileRows ?? []) as ProfileLookup[]).map((p) => [p.id, p])));
      setLoading(false);
    })();
  }, []);

  const startFulfil = (row: RequestRow) => {
    setOpenId(row.id);
    setBolag("");
    setPrice("");
  };

  const fulfil = async (row: RequestRow) => {
    if (!bolag.trim() || !Number(price)) return;
    setSaving(true);
    const supabase = createClient();
    const item = synthesizeItem(row.kind as FetchableKind);
    const { error: itemError } = await supabase
      .from("items")
      .insert({ id: item.id, user_id: row.user_id, kind: item.kind, data: item });
    if (itemError) {
      setSaving(false);
      return;
    }
    const { error: policyError } = await supabase.from("policies").insert({
      item_id: item.id,
      user_id: row.user_id,
      data: { id: createItemId(), name: bolag.trim(), price: Number(price), highlights: [], source: "fetched" },
    });
    if (policyError) {
      setSaving(false);
      return;
    }
    const ok = await saveField(supabase, {
      table: "missing_insurance_requests",
      idColumn: "id",
      id: row.id,
      targetUserId: row.user_id,
      actorEmail,
      field: "status",
      oldValue: row.status,
      newValue: "hanterad",
    });
    setSaving(false);
    if (ok) {
      setRequests((prev) => prev.filter((r) => r.id !== row.id));
      setOpenId(null);
    }
  };

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (requests.length === 0) return <p className="text-sm text-slate">Inga saknade försäkringar just nu.</p>;

  return (
    <div className="flex flex-col gap-3">
      {requests.map((row) => {
        const customer = profilesById[row.user_id];
        const kindLabel = ITEM_CATEGORIES.find((c) => c.kind === (row.kind as ItemKind))?.label ?? row.kind;
        const open = openId === row.id;
        return (
          <div key={row.id} className="bg-white rounded-2xl border border-line p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                  <HelpCircle size={16} className="text-forest" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {customer?.name || customer?.email || row.user_id} — {kindLabel}
                  </div>
                  <div className="text-xs text-slate">
                    {row.note ? `${row.note} · ` : ""}flaggad {formatDate(row.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-none">
                <button onClick={() => onOpenCustomer(row.user_id)} className="flex items-center gap-1.5 text-sm font-semibold text-forest">
                  Öppna kund <ArrowRight size={14} />
                </button>
                {!open && (
                  <button onClick={() => startFulfil(row)} className="text-sm font-semibold text-ink">
                    Hantera
                  </button>
                )}
              </div>
            </div>
            {open && (
              <div className="mt-4 pt-4 border-t border-line flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs font-medium mb-1 block text-slate">Bolag</label>
                  <input
                    list="fulfil-bolag-list"
                    value={bolag}
                    onChange={(e) => setBolag(e.target.value)}
                    placeholder="T.ex. Folksam"
                    className="w-full px-3 py-2 rounded-lg border border-line text-sm"
                  />
                  <datalist id="fulfil-bolag-list">
                    {FORSAKRINGSBOLAG.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                <div className="w-28">
                  <label className="text-xs font-medium mb-1 block text-slate">Pris (kr/mån)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="199"
                    className="w-full px-3 py-2 rounded-lg border border-line text-sm"
                  />
                </div>
                <button
                  onClick={() => fulfil(row)}
                  disabled={!bolag.trim() || !Number(price) || saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white bg-forest disabled:opacity-40"
                >
                  <Check size={14} /> Lägg till åt kunden
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
