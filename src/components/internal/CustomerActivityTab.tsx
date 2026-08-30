"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { maskPersonnummer } from "@/lib/personnummer";

type ActivityRow = {
  id: string;
  actor_email: string;
  table_name: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

type ViewRow = { id: string; viewer_email: string; viewed_at: string };

const FIELD_LABELS: Record<string, string> = {
  personnummer: "personnummer",
  phone: "telefon",
  address: "adress",
  email: "e-post",
  name: "bolag",
  price: "pris",
};

function describeField(field: string): string {
  const sub = field.includes(".") ? field.split(".")[1] : field;
  return FIELD_LABELS[sub] ?? sub;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" });
}

// saveField() maskerar personnummer innan skrivning (se activity-log.ts),
// men den här masken skyddar även äldre loggrader som skrevs innan den
// fixen fanns — annars skulle historiska rader fortfarande visa klartext.
function displayValue(field: string, value: string | null): string | null {
  if (value == null) return null;
  const sub = field.includes(".") ? field.split(".")[1] : field;
  return sub === "personnummer" ? maskPersonnummer(value) : value;
}

// Skrivskyddad audit-logg — se supabase/schema.sql, activity_log har
// ingen update/delete-policy, bara insert (från saveField()) + select.
export function CustomerActivityTab({ customerId }: { customerId: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const [{ data }, { data: viewRows }] = await Promise.all([
        supabase
          .from("activity_log")
          .select("id, actor_email, table_name, field, old_value, new_value, created_at")
          .eq("target_user_id", customerId)
          .order("created_at", { ascending: false }),
        supabase
          .from("customer_view_log")
          .select("id, viewer_email, viewed_at")
          .eq("customer_id", customerId)
          .order("viewed_at", { ascending: false })
          .limit(10),
      ]);
      setRows((data ?? []) as ActivityRow[]);
      setViews((viewRows ?? []) as ViewRow[]);
      setLoading(false);
    })();
  }, [customerId]);

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;

  return (
    <div className="flex flex-col gap-4">
      {views.length > 0 && (
        <div className="bg-white rounded-2xl border border-line p-4">
          <div className="text-xs mb-2 text-slate uppercase tracking-wide">Vem har tittat</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
            {views.map((v) => (
              <span key={v.id}>
                {v.viewer_email} · {formatDateTime(v.viewed_at)}
              </span>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-slate">Ingen aktivitet loggad än.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-line p-4">
          {rows.map((r) => (
            <div key={r.id} className="flex items-start gap-3 py-2.5 border-b border-line last:border-0 last:pb-0">
              <div className="flex-1 min-w-0 text-sm">
                <span className="font-semibold">{r.actor_email}</span> ändrade {describeField(r.field)}
                {r.old_value != null && (
                  <>
                    {" "}
                    från <span className="text-slate">{displayValue(r.field, r.old_value)}</span>
                  </>
                )}{" "}
                till <span className="font-medium">{displayValue(r.field, r.new_value) ?? "–"}</span>
              </div>
              <span className="text-xs text-slate flex-none whitespace-nowrap">{formatDateTime(r.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
