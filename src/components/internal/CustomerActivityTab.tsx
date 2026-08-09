"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ActivityRow = {
  id: string;
  actor_email: string;
  table_name: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

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

// Skrivskyddad audit-logg — se supabase/schema.sql, activity_log har
// ingen update/delete-policy, bara insert (från saveField()) + select.
export function CustomerActivityTab({ customerId }: { customerId: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("activity_log")
        .select("id, actor_email, table_name, field, old_value, new_value, created_at")
        .eq("target_user_id", customerId)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as ActivityRow[]);
      setLoading(false);
    })();
  }, [customerId]);

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate">Ingen aktivitet loggad än.</p>;

  return (
    <div className="bg-white rounded-2xl border border-line p-4">
      {rows.map((r) => (
        <div key={r.id} className="flex items-start gap-3 py-2.5 border-b border-line last:border-0 last:pb-0">
          <div className="flex-1 min-w-0 text-sm">
            <span className="font-semibold">{r.actor_email}</span> ändrade {describeField(r.field)}
            {r.old_value != null && (
              <>
                {" "}
                från <span className="text-slate">{r.old_value}</span>
              </>
            )}{" "}
            till <span className="font-medium">{r.new_value ?? "–"}</span>
          </div>
          <span className="text-xs text-slate flex-none whitespace-nowrap">{formatDateTime(r.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
