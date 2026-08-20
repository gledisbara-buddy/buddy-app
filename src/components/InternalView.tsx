"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { RequestsInbox } from "@/components/internal/RequestsInbox";
import { CancellationQueue } from "@/components/internal/CancellationQueue";
import { MissingInsuranceQueue } from "@/components/internal/MissingInsuranceQueue";
import { AccountDeletionQueue } from "@/components/internal/AccountDeletionQueue";
import { CustomerListView } from "@/components/internal/CustomerListView";
import { CustomerSearchRail } from "@/components/internal/CustomerSearchRail";
import { CustomerWorkspace } from "@/components/internal/CustomerWorkspace";
import { EmployeeDashboard } from "@/components/internal/EmployeeDashboard";
import { EmployeeProfile } from "@/components/internal/EmployeeProfile";
import { MfaGate } from "@/components/internal/MfaGate";
import { useBuddy } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";
import { saveField } from "@/lib/activity-log";
import type { HouseholdRelation } from "@/lib/household";

export type CustomerStatus = "aktiv" | "vilande" | "avslutad";
export type CustomerSegment = "ny" | "etablerad" | "vip" | "risk";

export type InternalCustomerProfile = {
  id: string;
  name: string;
  email: string | null;
  personnummer: string | null;
  phone: string | null;
  address: string | null;
  household_id: string | null;
  household_relation: HouseholdRelation | null;
  fullmakt_signed_at: string | null;
  created_at: string;
  customer_status: CustomerStatus;
  segment: CustomerSegment | null;
  tags: string[];
};

const CUSTOMER_SELECT =
  "id, name, email, personnummer, phone, address, household_id, household_relation, fullmakt_signed_at, created_at, customer_status, segment, tags";

export function InternalView() {
  const router = useRouter();
  const { userType, loading, isEmployee, profile, userId } = useBuddy();
  const [tab, setTab] = useState<
    "dashboard" | "forfragningar" | "uppsagningar" | "saknade" | "radering" | "kundsok" | "profil"
  >("dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState<InternalCustomerProfile | null>(null);

  useEffect(() => {
    if (!loading && (!userType || !isEmployee)) router.replace("/dashboard");
  }, [loading, userType, isEmployee, router]);

  // En rad per gång internverktyget öppnas — se Inloggningshistorik i
  // EmployeeProfile.tsx. loggedRef förhindrar en dubblettrad om den här
  // effekten skulle köra om (t.ex. React strict mode i dev).
  const loggedRef = useRef(false);
  useEffect(() => {
    if (!isEmployee || !profile?.email || loggedRef.current) return;
    loggedRef.current = true;
    createClient().from("employee_login_log").insert({ employee_email: profile.email }).then(() => {});
  }, [isEmployee, profile?.email]);

  const fetchCustomer = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select(CUSTOMER_SELECT).eq("id", id).single();
    if (data) setSelectedCustomer(data as InternalCustomerProfile);
  }, []);

  const handleFieldSave = useCallback(
    async (field: "personnummer" | "phone" | "address", value: string): Promise<boolean> => {
      if (!selectedCustomer || !profile?.email) return false;
      const ok = await saveField(createClient(), {
        table: "profiles",
        idColumn: "id",
        id: selectedCustomer.id,
        targetUserId: selectedCustomer.id,
        actorEmail: profile.email,
        field,
        oldValue: selectedCustomer[field],
        newValue: value || null,
      });
      if (ok) setSelectedCustomer((prev) => (prev ? { ...prev, [field]: value || null } : prev));
      return ok;
    },
    [selectedCustomer, profile]
  );

  // Bredare variant för de nya klassificeringsfälten (status/segment/
  // taggar) — samma saveField-mönster, men värdet kan vara en array
  // (tags) eller null (segment), inte bara en sträng.
  const handleClassificationSave = useCallback(
    async (field: "customer_status" | "segment" | "tags", value: string | string[] | null): Promise<boolean> => {
      if (!selectedCustomer || !profile?.email) return false;
      const ok = await saveField(createClient(), {
        table: "profiles",
        idColumn: "id",
        id: selectedCustomer.id,
        targetUserId: selectedCustomer.id,
        actorEmail: profile.email,
        field,
        oldValue: selectedCustomer[field],
        newValue: value,
      });
      if (ok) setSelectedCustomer((prev) => (prev ? { ...prev, [field]: value } : prev));
      return ok;
    },
    [selectedCustomer, profile]
  );

  if (loading || !userType || !isEmployee) return null;

  return (
    <MfaGate>
      <div className="min-h-screen w-full">
        <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
        <div className={`mx-auto px-5 md:px-10 py-10 bd-fade ${tab === "kundsok" ? "max-w-6xl" : "max-w-3xl"}`}>
          <span className="bd-eyebrow">Internt</span>
          <h1 className="bd-display text-3xl mt-2 mb-6">Anställdvy</h1>

          <div className="flex items-center gap-1 mb-6 p-1 rounded-full max-w-full overflow-x-auto bg-frost-2">
            <button
              onClick={() => setTab("dashboard")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex-none whitespace-nowrap"
              style={
                tab === "dashboard"
                  ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                  : { color: "var(--color-slate)" }
              }
            >
              Översikt
            </button>
            <button
              onClick={() => setTab("forfragningar")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex-none whitespace-nowrap"
              style={
                tab === "forfragningar"
                  ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                  : { color: "var(--color-slate)" }
              }
            >
              Förfrågningar
            </button>
            <button
              onClick={() => setTab("uppsagningar")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex-none whitespace-nowrap"
              style={
                tab === "uppsagningar"
                  ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                  : { color: "var(--color-slate)" }
              }
            >
              Uppsägningar
            </button>
            <button
              onClick={() => setTab("saknade")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex-none whitespace-nowrap"
              style={
                tab === "saknade"
                  ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                  : { color: "var(--color-slate)" }
              }
            >
              Saknade försäkringar
            </button>
            <button
              onClick={() => setTab("radering")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex-none whitespace-nowrap"
              style={
                tab === "radering"
                  ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                  : { color: "var(--color-slate)" }
              }
            >
              Kontoradering
            </button>
            <button
              onClick={() => setTab("kundsok")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex-none whitespace-nowrap"
              style={
                tab === "kundsok"
                  ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                  : { color: "var(--color-slate)" }
              }
            >
              Kundsök
            </button>
            <button
              onClick={() => setTab("profil")}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex-none whitespace-nowrap"
              style={
                tab === "profil"
                  ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                  : { color: "var(--color-slate)" }
              }
            >
              Min profil
            </button>
          </div>

          {tab === "dashboard" && profile?.email && (
            <EmployeeDashboard
              email={profile.email}
              onOpenCustomer={(id) => {
                fetchCustomer(id);
                setTab("kundsok");
              }}
              onNavigateTab={(t) => setTab(t)}
            />
          )}
          {tab === "forfragningar" && <RequestsInbox />}
          {tab === "uppsagningar" && (
            <CancellationQueue
              onOpenCustomer={(id) => {
                fetchCustomer(id);
                setTab("kundsok");
              }}
            />
          )}
          {tab === "saknade" && (
            <MissingInsuranceQueue
              actorEmail={profile?.email ?? ""}
              onOpenCustomer={(id) => {
                fetchCustomer(id);
                setTab("kundsok");
              }}
            />
          )}
          {tab === "radering" && (
            <AccountDeletionQueue
              actorEmail={profile?.email ?? ""}
              onOpenCustomer={(id) => {
                fetchCustomer(id);
                setTab("kundsok");
              }}
            />
          )}
          {tab === "kundsok" && (
            <div className="flex flex-col md:flex-row gap-6">
              <CustomerSearchRail
                selectedCustomer={selectedCustomer}
                onSelectCustomer={fetchCustomer}
                onHouseholdChanged={() => selectedCustomer && fetchCustomer(selectedCustomer.id)}
              />
              {selectedCustomer ? (
                <CustomerWorkspace
                  customer={selectedCustomer}
                  actorEmail={profile?.email ?? ""}
                  onFieldSave={handleFieldSave}
                  onClassificationSave={handleClassificationSave}
                />
              ) : (
                <CustomerListView onSelectCustomer={fetchCustomer} />
              )}
            </div>
          )}
          {tab === "profil" && profile?.email && userId && <EmployeeProfile email={profile.email} userId={userId} />}
        </div>
      </div>
    </MfaGate>
  );
}
