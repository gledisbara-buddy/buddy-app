"use client";

import { useEffect, useState } from "react";
import { ClipboardSignature } from "lucide-react";
import { EditableField } from "@/components/internal/EditableField";
import { CustomerItemsTab } from "@/components/internal/CustomerItemsTab";
import { CustomerCasesTab } from "@/components/internal/CustomerCasesTab";
import { CustomerNotesTab } from "@/components/internal/CustomerNotesTab";
import { CustomerActivityTab } from "@/components/internal/CustomerActivityTab";
import { createClient } from "@/lib/supabase/client";
import type { InternalCustomerProfile } from "@/components/InternalView";

type Tab = "saker" | "arenden" | "anteckningar" | "aktivitet";

const TABS: [Tab, string][] = [
  ["saker", "Saker & avtal"],
  ["arenden", "Ärenden"],
  ["anteckningar", "Anteckningar"],
  ["aktivitet", "Aktivitet"],
];

export function CustomerWorkspace({
  customer,
  actorEmail,
  onFieldSave,
}: {
  customer: InternalCustomerProfile;
  actorEmail: string;
  onFieldSave: (field: "personnummer" | "phone" | "address", value: string) => Promise<boolean>;
}) {
  const [tab, setTab] = useState<Tab>("saker");
  // Isolerad från customer-frågan i InternalView.tsx (CUSTOMER_SELECT) med
  // avsikt — notify_email är en ny kolumn som kanske inte finns i
  // databasen än, och en trasig kolumn i huvudfrågan hade slagit ut hela
  // kundvyn. Standard "skicka" (true) om hämtningen misslyckas eller
  // kolumnen saknas, samma beteende som innan den här inställningen fanns.
  const [customerNotifyEmail, setCustomerNotifyEmail] = useState(true);
  // Nollställ till default under rendering när kunden byts (inte i en
  // effekt) — samma "syncedX"-mönster som SettingsPage.tsx/Dashboard.tsx.
  const [syncedCustomerId, setSyncedCustomerId] = useState(customer.id);
  if (customer.id !== syncedCustomerId) {
    setSyncedCustomerId(customer.id);
    setCustomerNotifyEmail(true);
  }

  useEffect(() => {
    createClient()
      .from("profiles")
      .select("notify_email")
      .eq("id", customer.id)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { notify_email: boolean | null } | null;
        if (row && row.notify_email === false) setCustomerNotifyEmail(false);
      });
  }, [customer.id]);

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
          {customer.fullmakt_signed_at ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 bg-frost-2 text-forest">
              <ClipboardSignature size={12} /> Fullmakt signerad
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-line text-slate">
              Fullmakt ej signerad
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-line">
          <EditableField
            label="Personnummer"
            value={customer.personnummer}
            placeholder="ÅÅÅÅMMDD-XXXX"
            onSave={(v) => onFieldSave("personnummer", v)}
          />
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
      </div>

      <div className="flex items-center gap-1 mb-5 p-1 rounded-full w-fit bg-frost-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
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
        />
      )}
      {tab === "arenden" && (
        <CustomerCasesTab
          customerId={customer.id}
          actorEmail={actorEmail}
          customerEmail={customer.email}
          customerNotifyEmail={customerNotifyEmail}
        />
      )}
      {tab === "anteckningar" && <CustomerNotesTab customerId={customer.id} actorEmail={actorEmail} />}
      {tab === "aktivitet" && <CustomerActivityTab customerId={customer.id} />}
    </div>
  );
}
