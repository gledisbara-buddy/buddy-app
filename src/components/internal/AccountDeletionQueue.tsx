"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveField } from "@/lib/activity-log";

type RequestRow = { id: string; user_id: string; status: string; created_at: string };
type ProfileLookup = { id: string; name: string; email: string | null };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

// Kö över kunders GDPR-raderingsbegäranden (SettingsPage.tsx). Att
// markera "hanterad" här betyder att en anställd faktiskt har raderat
// kundens auth-konto i Supabase Studio utanför appen — den här klienten
// har bara anon-nyckeln och kan aldrig radera en auth.users-rad själv.
// Samma "kö av ärenden en anställd hanterar"-mönster som
// MissingInsuranceQueue.tsx/CancellationQueue.tsx.
export function AccountDeletionQueue({
  actorEmail,
  onOpenCustomer,
}: {
  actorEmail: string;
  onOpenCustomer: (customerId: string) => void;
}) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLookup>>({});
  const [loading, setLoading] = useState(true);
  const [handlingId, setHandlingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const { data: requestRows } = await supabase
        .from("account_deletion_requests")
        .select("id, user_id, status, created_at")
        .eq("status", "pending")
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

  const markHandled = async (row: RequestRow) => {
    setHandlingId(row.id);
    const supabase = createClient();
    const ok = await saveField(supabase, {
      table: "account_deletion_requests",
      idColumn: "id",
      id: row.id,
      targetUserId: row.user_id,
      actorEmail,
      field: "status",
      oldValue: row.status,
      newValue: "done",
    });
    setHandlingId(null);
    if (ok) setRequests((prev) => prev.filter((r) => r.id !== row.id));
  };

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (requests.length === 0) return <p className="text-sm text-slate">Inga raderingsbegäranden just nu.</p>;

  return (
    <div className="flex flex-col gap-3">
      {requests.map((row) => {
        const customer = profilesById[row.user_id];
        return (
          <div key={row.id} className="bg-white rounded-2xl border border-line p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                <UserX size={16} className="text-forest" />
              </div>
              <div>
                <div className="text-sm font-semibold">{customer?.name || customer?.email || row.user_id}</div>
                <div className="text-xs text-slate">begärd {formatDate(row.created_at)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-none">
              <button onClick={() => onOpenCustomer(row.user_id)} className="flex items-center gap-1.5 text-sm font-semibold text-forest">
                Öppna kund <ArrowRight size={14} />
              </button>
              <button
                onClick={() => markHandled(row)}
                disabled={handlingId === row.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white bg-forest disabled:opacity-40"
              >
                <Check size={14} /> Konto raderat
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
