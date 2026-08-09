"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { itemSummary, itemTitle, type InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";
import { EditableField } from "@/components/internal/EditableField";

// Redigering av hela sak-objektet (items.data) är ett djupt nästlat
// jsonb-schema med en form per sakslag — utanför scope här. Det som
// faktiskt behöver kunna rättas manuellt av en anställd är det tecknade
// avtalets bolag/pris, så bara policies.data redigeras, inte items.data.
export function CustomerItemsTab({ customerId, actorEmail }: { customerId: string; actorEmail: string }) {
  const [items, setItems] = useState<InsuranceItem[]>([]);
  const [policies, setPolicies] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const [{ data: itemRows }, { data: policyRows }] = await Promise.all([
        supabase.from("items").select("data").eq("user_id", customerId),
        supabase.from("policies").select("item_id, data").eq("user_id", customerId),
      ]);
      setItems(((itemRows ?? []) as { data: InsuranceItem }[]).map((r) => r.data));
      setPolicies(
        Object.fromEntries(((policyRows ?? []) as { item_id: string; data: Quote }[]).map((r) => [r.item_id, r.data]))
      );
      setLoading(false);
    })();
  }, [customerId]);

  const updatePolicyField = async (itemId: string, field: "name" | "price", value: string) => {
    const current = policies[itemId];
    if (!current) return false;
    const newValue = field === "price" ? Number(value) : value;
    if (field === "price" && Number.isNaN(newValue)) return false;
    const updatedQuote = { ...current, [field]: newValue };

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("policies")
      .update({ data: updatedQuote })
      .eq("item_id", itemId)
      .eq("user_id", customerId);
    if (updateError) return false;

    const { error: logError } = await supabase.from("activity_log").insert({
      target_user_id: customerId,
      actor_email: actorEmail,
      table_name: "policies",
      field: `${itemId}.${field}`,
      old_value: String(current[field]),
      new_value: String(newValue),
    });
    if (logError) return false;

    setPolicies((prev) => ({ ...prev, [itemId]: updatedQuote }));
    return true;
  };

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (items.length === 0) return <p className="text-sm text-slate">Inget tillagt än.</p>;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const signed = policies[item.id];
        return (
          <div key={item.id} className="bg-white rounded-2xl border border-line p-4">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase size={15} className="text-forest" />
              <div className="font-semibold text-sm">{itemTitle(item)}</div>
            </div>
            <div className="text-xs text-slate mb-3">{itemSummary(item)}</div>
            {signed ? (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line">
                <EditableField label="Bolag" value={signed.name} onSave={(v) => updatePolicyField(item.id, "name", v)} />
                <EditableField
                  label="Pris (kr/mån)"
                  value={String(signed.price)}
                  onSave={(v) => updatePolicyField(item.id, "price", v)}
                />
              </div>
            ) : (
              <p className="text-xs text-slate">Inget avtal tecknat än.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
