"use client";

import { useEffect, useState } from "react";
import { ClipboardSignature, Download, Mail, MessageSquare, X } from "lucide-react";
import { EditableField } from "@/components/internal/EditableField";
import { CustomerItemsTab } from "@/components/internal/CustomerItemsTab";
import { CustomerCasesTab } from "@/components/internal/CustomerCasesTab";
import { CustomerNotesTab } from "@/components/internal/CustomerNotesTab";
import { CustomerActivityTab } from "@/components/internal/CustomerActivityTab";
import { CustomerDocumentsTab } from "@/components/internal/CustomerDocumentsTab";
import { PillGroup } from "@/components/onboarding/shared";
import { createClient } from "@/lib/supabase/client";
import type { CustomerSegment, CustomerStatus, InternalCustomerProfile } from "@/components/InternalView";

type Tab = "saker" | "arenden" | "dokument" | "anteckningar" | "aktivitet";

const TABS: [Tab, string][] = [
  ["saker", "Saker & avtal"],
  ["arenden", "Ärenden"],
  ["dokument", "Dokument"],
  ["anteckningar", "Anteckningar"],
  ["aktivitet", "Aktivitet"],
];

const STATUS_LABELS: Record<CustomerStatus, string> = { aktiv: "Aktiv", vilande: "Vilande", avslutad: "Avslutad" };
const SEGMENT_LABELS: Record<CustomerSegment, string> = { ny: "Ny kund", etablerad: "Etablerad", vip: "VIP", risk: "Uppsägningsrisk" };

export function CustomerWorkspace({
  customer,
  actorEmail,
  myPermissionLevel,
  onFieldSave,
  onClassificationSave,
}: {
  customer: InternalCustomerProfile;
  actorEmail: string;
  myPermissionLevel: string | null;
  onFieldSave: (field: "personnummer" | "phone" | "address", value: string) => Promise<boolean>;
  onClassificationSave: (field: "customer_status" | "segment" | "tags", value: string | string[] | null) => Promise<boolean>;
}) {
  const canDelete = myPermissionLevel === "admin" || myPermissionLevel === "teamledare";
  const isKundservice = myPermissionLevel === "kundservice";
  const [tab, setTab] = useState<Tab>("saker");
  const [tagDraft, setTagDraft] = useState("");
  // Isolerad från customer-frågan i InternalView.tsx (CUSTOMER_SELECT) med
  // avsikt — notify_email/notify_sms är nyare kolumner som kanske inte
  // finns i databasen än, och en trasig kolumn i huvudfrågan hade slagit
  // ut hela kundvyn. Standard "skicka" (true/false) om hämtningen
  // misslyckas eller kolumnen saknas, samma beteende som innan den här
  // inställningen fanns.
  const [customerNotifyEmail, setCustomerNotifyEmail] = useState(true);
  const [customerNotifySms, setCustomerNotifySms] = useState(false);
  // Nollställ till default under rendering när kunden byts (inte i en
  // effekt) — samma "syncedX"-mönster som SettingsPage.tsx/Dashboard.tsx.
  const [syncedCustomerId, setSyncedCustomerId] = useState(customer.id);
  if (customer.id !== syncedCustomerId) {
    setSyncedCustomerId(customer.id);
    setCustomerNotifyEmail(true);
    setCustomerNotifySms(false);
    setTagDraft("");
  }

  useEffect(() => {
    createClient()
      .from("profiles")
      .select("notify_email, notify_sms")
      .eq("id", customer.id)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { notify_email: boolean | null; notify_sms: boolean | null } | null;
        if (!row) return;
        setCustomerNotifyEmail(row.notify_email !== false);
        setCustomerNotifySms(!!row.notify_sms);
      });
  }, [customer.id]);

  const saveNotifyPref = async (field: "notify_email" | "notify_sms", value: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ [field]: value }).eq("id", customer.id);
    if (!error) {
      if (field === "notify_email") setCustomerNotifyEmail(value);
      else setCustomerNotifySms(value);
    }
  };

  // GDPR-export, anställd-triggad — samma exportformat som kundens egen
  // SettingsPage.tsx redan erbjuder, men här för en anställd som behöver
  // lämna ut eller granska en kunds uppgifter.
  const handleExport = async () => {
    const supabase = createClient();
    const [{ data: items }, { data: policies }, { data: bookings }, { data: claims }] = await Promise.all([
      supabase.from("items").select("data").eq("user_id", customer.id),
      supabase.from("policies").select("item_id, data").eq("user_id", customer.id),
      supabase.from("bookings").select("*").eq("user_id", customer.id),
      supabase.from("claims").select("*").eq("user_id", customer.id),
    ]);
    const exportData = {
      exporterat: new Date().toISOString(),
      exporteratAv: actorEmail,
      kund: customer,
      saker: items,
      avtal: policies,
      bokningar: bookings,
      skadeanmalningar: claims,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kunddata-${customer.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addTag = () => {
    const value = tagDraft.trim();
    if (!value || customer.tags.includes(value)) {
      setTagDraft("");
      return;
    }
    onClassificationSave("tags", [...customer.tags, value]);
    setTagDraft("");
  };

  const removeTag = (tagToRemove: string) => {
    onClassificationSave(
      "tags",
      customer.tags.filter((t) => t !== tagToRemove)
    );
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="bg-white rounded-2xl border border-line p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-none text-white font-semibold bd-display bg-forest">
              {(customer.name || "?")[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-[17px]">{customer.name || "(Namn saknas)"}</div>
              {customer.created_at && (
                <div className="text-xs text-slate">
                  Kund sedan{" "}
                  {new Date(customer.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-none">
            {customer.fullmakt_signed_at ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 bg-frost-2 text-forest">
                <ClipboardSignature size={12} /> Fullmakt signerad
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-line text-slate">
                Fullmakt ej signerad
              </span>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-line text-slate hover:text-ink"
            >
              <Download size={12} /> Exportera
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-line mb-4">
          {isKundservice ? (
            <div>
              <div className="text-xs mb-1 text-slate uppercase tracking-wide">Personnummer</div>
              <div className="text-sm font-medium min-h-[28px] flex items-center">{customer.personnummer || "–"}</div>
              <p className="text-xs mt-1 text-slate">Maskerat och skrivskyddat för din roll.</p>
            </div>
          ) : (
            <EditableField
              label="Personnummer"
              value={customer.personnummer}
              placeholder="ÅÅÅÅMMDD-XXXX"
              onSave={(v) => onFieldSave("personnummer", v)}
            />
          )}
          <div>
            <div className="text-xs mb-1 text-slate uppercase tracking-wide">E-post</div>
            <div className="text-sm font-medium min-h-[28px] flex items-center">{customer.email || "–"}</div>
          </div>
          <EditableField
            label="Telefon"
            value={customer.phone}
            placeholder="070-123 45 67"
            onSave={(v) => onFieldSave("phone", v)}
          />
          <EditableField
            label="Adress"
            value={customer.address}
            placeholder="Gatan 1, Ort"
            onSave={(v) => onFieldSave("address", v)}
          />
        </div>

        <div className="pt-4 border-t border-line mb-4">
          <div className="text-xs mb-1.5 text-slate uppercase tracking-wide">Status</div>
          <PillGroup
            options={["aktiv", "vilande", "avslutad"] as const}
            labels={STATUS_LABELS}
            value={customer.customer_status}
            onChange={(v) => onClassificationSave("customer_status", v)}
          />
        </div>

        <div className="pt-1 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs text-slate uppercase tracking-wide">Segment</div>
            {customer.segment && (
              <button onClick={() => onClassificationSave("segment", null)} className="text-xs font-semibold text-slate hover:text-ink">
                Rensa
              </button>
            )}
          </div>
          <PillGroup
            options={["ny", "etablerad", "vip", "risk"] as const}
            labels={SEGMENT_LABELS}
            value={customer.segment}
            onChange={(v) => onClassificationSave("segment", v)}
          />
        </div>

        <div className="pt-1 mb-4">
          <div className="text-xs mb-1.5 text-slate uppercase tracking-wide">Taggar</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {customer.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-frost-2 text-forest">
                {t}
                <button onClick={() => removeTag(t)} aria-label={`Ta bort taggen ${t}`}>
                  <X size={11} />
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="+ Lägg till tagg"
              className="text-xs px-2.5 py-1 rounded-full border border-line w-28 focus:w-40 transition-all"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-line">
          <div className="text-xs mb-2 text-slate uppercase tracking-wide">Kommunikation</div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => saveNotifyPref("notify_email", !customerNotifyEmail)}
              className="flex items-center gap-1.5 text-sm"
            >
              <Mail size={14} className={customerNotifyEmail ? "text-forest" : "text-slate"} />
              E-post {customerNotifyEmail ? "på" : "av"}
            </button>
            <button
              onClick={() => saveNotifyPref("notify_sms", !customerNotifySms)}
              className="flex items-center gap-1.5 text-sm"
            >
              <MessageSquare size={14} className={customerNotifySms ? "text-forest" : "text-slate"} />
              SMS {customerNotifySms ? "på" : "av"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-5 p-1 rounded-full w-fit max-w-full overflow-x-auto bg-frost-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold flex-none whitespace-nowrap"
            style={
              tab === id
                ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                : { color: "var(--color-slate)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "saker" && (
        <CustomerItemsTab
          customerId={customer.id}
          actorEmail={actorEmail}
          customerEmail={customer.email}
          customerNotifyEmail={customerNotifyEmail}
          canDelete={canDelete}
        />
      )}
      {tab === "arenden" && (
        <CustomerCasesTab
          customerId={customer.id}
          actorEmail={actorEmail}
          customerEmail={customer.email}
          customerNotifyEmail={customerNotifyEmail}
          canDelete={canDelete}
        />
      )}
      {tab === "dokument" && <CustomerDocumentsTab customerId={customer.id} />}
      {tab === "anteckningar" && <CustomerNotesTab customerId={customer.id} actorEmail={actorEmail} />}
      {tab === "aktivitet" && <CustomerActivityTab customerId={customer.id} />}
    </div>
  );
}
