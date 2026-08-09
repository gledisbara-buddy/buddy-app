"use client";

import { useEffect, useState } from "react";
import { CircleSlash, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { itemTitle, type InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";

type PolicyRow = { item_id: string; user_id: string; data: Quote };
type ProfileLookup = { id: string; name: string; email: string | null };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

// Samlad kö över ALLA kunders pågående uppsägningar (policies.data.
// cancellationPending = true), motsvarande Förfrågningar-fliken för
// bookings/claims — annars måste en anställd leta upp varje kund
// manuellt för att hitta vilka uppsägningar som väntar.
export function CancellationQueue({ onOpenCustomer }: { onOpenCustomer: (customerId: string) => void }) {
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLookup>>({});
  const [itemTitlesById, setItemTitlesById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const { data: policyRows } = await supabase
        .from("policies")
        .select("item_id, user_id, data")
        .eq("data->>cancellationPending", "true");
      const rows = (policyRows ?? []) as PolicyRow[];
      setPolicies(rows);

      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const itemIds = rows.map((r) => r.item_id);
      const [{ data: profileRows }, { data: itemRows }] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles").select("id, name, email").in("id", userIds)
          : Promise.resolve({ data: [] as ProfileLookup[] }),
        itemIds.length > 0
          ? supabase.from("items").select("id, data").in("id", itemIds)
          : Promise.resolve({ data: [] as { id: string; data: InsuranceItem }[] }),
      ]);
      setProfilesById(Object.fromEntries(((profileRows ?? []) as ProfileLookup[]).map((p) => [p.id, p])));
      setItemTitlesById(
        Object.fromEntries(
          ((itemRows ?? []) as { id: string; data: InsuranceItem }[]).map((r) => [r.id, itemTitle(r.data)])
        )
      );
      setLoading(false);
    })();
  }, []);

  const sorted = [...policies].sort((a, b) => {
    const da = a.data.cancellationRequestedAt ?? "";
    const db = b.data.cancellationRequestedAt ?? "";
    return db.localeCompare(da);
  });

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (sorted.length === 0) return <p className="text-sm text-slate">Inga pågående uppsägningar just nu.</p>;

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((row) => {
        const customer = profilesById[row.user_id];
        const title = itemTitlesById[row.item_id] ?? "Okänd sak";
        return (
          <div key={row.item_id} className="bg-white rounded-2xl border border-line p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                <CircleSlash size={16} className="text-forest" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {customer?.name || customer?.email || row.user_id} — {title}
                </div>
                <div className="text-xs text-slate">
                  Buddy säger upp hos {row.data.name}
                  {row.data.forfallodatum ? ` till förfallodagen ${row.data.forfallodatum}` : ""}
                  {row.data.cancellationRequestedAt ? ` · begärt ${formatDate(row.data.cancellationRequestedAt)}` : ""}
                </div>
              </div>
            </div>
            <button
              onClick={() => onOpenCustomer(row.user_id)}
              className="flex items-center gap-1.5 text-sm font-semibold text-forest flex-none"
            >
              Öppna kund <ArrowRight size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
