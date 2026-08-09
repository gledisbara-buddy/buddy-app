"use client";

import { useEffect, useState } from "react";
import { Briefcase, CircleSlash, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/Overlay";
import { itemSummary, itemTitle, type InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";
import { EditableField } from "@/components/internal/EditableField";
import { sendTransactionalEmail } from "@/lib/email";

type ConfirmAction = { kind: "delete"; itemId: string; title: string } | { kind: "cancel"; itemId: string };

// Redigering av hela sak-objektet (items.data) är ett djupt nästlat
// jsonb-schema med en form per sakslag — utanför scope här. Det som
// faktiskt behöver kunna rättas manuellt av en anställd är det tecknade
// avtalets bolag/pris, så bara policies.data redigeras, inte items.data.
export function CustomerItemsTab({
  customerId,
  actorEmail,
  customerEmail,
}: {
  customerId: string;
  actorEmail: string;
  customerEmail: string | null;
}) {
  const [items, setItems] = useState<InsuranceItem[]>([]);
  const [policies, setPolicies] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

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

  const updatePolicyField = async (itemId: string, field: string, oldValue: unknown, newValue: unknown, updatedQuote: Quote) => {
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
      old_value: oldValue == null ? null : String(oldValue),
      new_value: newValue == null ? null : String(newValue),
    });
    if (logError) return false;

    setPolicies((prev) => ({ ...prev, [itemId]: updatedQuote }));
    return true;
  };

  const saveName = (itemId: string, value: string) => {
    const current = policies[itemId];
    if (!current) return Promise.resolve(false);
    return updatePolicyField(itemId, "name", current.name, value, { ...current, name: value });
  };

  const savePrice = (itemId: string, value: string) => {
    const current = policies[itemId];
    if (!current) return Promise.resolve(false);
    const price = Number(value);
    if (Number.isNaN(price)) return Promise.resolve(false);
    return updatePolicyField(itemId, "price", current.price, price, { ...current, price });
  };

  const confirmCancellation = async () => {
    if (!confirmAction || confirmAction.kind !== "cancel") return;
    const current = policies[confirmAction.itemId];
    if (!current) return;
    const ok = await updatePolicyField(
      confirmAction.itemId,
      "cancellationPending",
      false,
      true,
      { ...current, cancellationPending: true, cancellationRequestedAt: new Date().toISOString() }
    );
    setConfirmAction(null);
    if (ok && customerEmail) {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        sendTransactionalEmail(token, {
          type: "cancellation_confirmation",
          to: customerEmail,
          bolag: current.name,
          forfallodatum: current.forfallodatum,
        });
      }
    }
  };

  const undoCancellation = async (itemId: string) => {
    const current = policies[itemId];
    if (!current) return;
    await updatePolicyField(itemId, "cancellationPending", true, false, {
      ...current,
      cancellationPending: false,
      cancellationRequestedAt: undefined,
    });
  };

  const confirmDeletion = async () => {
    if (!confirmAction || confirmAction.kind !== "delete") return;
    const { itemId, title } = confirmAction;
    const supabase = createClient();
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    setConfirmAction(null);
    if (error) return;
    await supabase.from("activity_log").insert({
      target_user_id: customerId,
      actor_email: actorEmail,
      table_name: "items",
      field: "borttagen",
      old_value: title,
      new_value: null,
    });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setPolicies((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
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
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line mb-3">
                <EditableField label="Bolag" value={signed.name} onSave={(v) => saveName(item.id, v)} />
                <EditableField label="Pris (kr/mån)" value={String(signed.price)} onSave={(v) => savePrice(item.id, v)} />
              </div>
            ) : (
              <p className="text-xs text-slate mb-3">Inget avtal tecknat än.</p>
            )}

            {signed?.cancellationPending && (
              <div className="rounded-xl p-3 mb-3 flex items-start gap-2 bg-frost-2">
                <CircleSlash size={14} className="flex-none mt-0.5 text-forest" />
                <div className="text-xs text-ink">
                  Uppsägning schemalagd{signed.forfallodatum ? ` till ${signed.forfallodatum}` : ""}.{" "}
                  <button onClick={() => undoCancellation(item.id)} className="font-semibold text-forest underline">
                    Ångra
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {signed && !signed.cancellationPending && (
                <button
                  onClick={() => setConfirmAction({ kind: "cancel", itemId: item.id })}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-amber-deep border border-line"
                >
                  <CircleSlash size={13} /> Annullera{signed.forfallodatum ? ` från ${signed.forfallodatum}` : ""}
                </button>
              )}
              <button
                onClick={() => setConfirmAction({ kind: "delete", itemId: item.id, title: itemTitle(item) })}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-red-600 border border-line ml-auto"
              >
                <Trash2 size={13} /> Ta bort
              </button>
            </div>
          </div>
        );
      })}

      {confirmAction?.kind === "cancel" && (
        <ConfirmDialog
          title="Annullera försäkringen?"
          body="Buddy kontaktar bolaget för att säga upp avtalet till förfallodagen. Kunden ser en notis om det på sin översikt. Avtalet raderas inte förrän dess."
          confirmLabel="Annullera"
          onConfirm={confirmCancellation}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.kind === "delete" && (
        <ConfirmDialog
          title="Ta bort saken?"
          body={
            policies[confirmAction.itemId]?.cancellationPending
              ? "Det här tar bort saken permanent, inklusive den schemalagda uppsägningen. Går inte att ångra."
              : "Det här går inte att ångra."
          }
          confirmLabel="Ta bort"
          onConfirm={confirmDeletion}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
