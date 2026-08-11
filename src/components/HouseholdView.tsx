"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Home, UserPlus, X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ConfirmDialog } from "@/components/Overlay";
import { Field, PillGroup, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";
import { HOUSEHOLD_RELATION_LABELS, type HouseholdRelation } from "@/lib/household";

const SENT_STATUS_LABELS: Record<"pending" | "approved" | "declined", string> = {
  pending: "Väntar på svar",
  approved: "Godkänd",
  declined: "Nekad",
};

export function HouseholdView() {
  const router = useRouter();
  const {
    userType,
    loading,
    profile,
    household,
    createHousehold,
    leaveHousehold,
    householdRequests,
    sentHouseholdRequests,
    requestHouseholdJoin,
    respondToHouseholdRequest,
  } = useBuddy();
  const [householdName, setHouseholdName] = useState("");
  const [creating, setCreating] = useState(false);
  const [invitePersonnummer, setInvitePersonnummer] = useState("");
  const [inviteRelation, setInviteRelation] = useState<HouseholdRelation | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  useEffect(() => {
    if (!inviteSent) return;
    const t = setTimeout(() => setInviteSent(false), 3000);
    return () => clearTimeout(t);
  }, [inviteSent]);

  if (loading || !userType) return null;

  const handleCreate = async () => {
    setCreating(true);
    await createHousehold(householdName);
    setCreating(false);
  };

  const handleInvite = async () => {
    if (invitePersonnummer.trim().length < 6 || !inviteRelation) return;
    setInviting(true);
    setInviteError(null);
    // Alltid samma respons oavsett om personnumret matchade en befintlig
    // kund eller inte — se request_household_join() i schema.sql. Om
    // gränssnittet visade olika meddelanden här skulle det avslöja
    // existens-information om andra kunders konton.
    const ok = await requestHouseholdJoin(invitePersonnummer, inviteRelation);
    setInviting(false);
    if (ok) {
      setInvitePersonnummer("");
      setInviteRelation(null);
      setInviteSent(true);
    } else {
      setInviteError("Kunde inte skicka förfrågan. Kontrollera personnumret och försök igen.");
    }
  };

  const handleRespond = async (requestId: string, approve: boolean) => {
    setRespondingId(requestId);
    await respondToHouseholdRequest(requestId, approve);
    setRespondingId(null);
  };

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-lg mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Hushåll</span>
        <h1 className="bd-display text-3xl mt-2 mb-2">{household ? "Ert hushåll" : "Skapa ett hushåll"}</h1>

        {householdRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-line p-5 mb-6">
            <div className="text-xs mb-3 text-slate">INKOMMANDE FÖRFRÅGNINGAR</div>
            <div className="flex flex-col gap-4">
              {householdRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm">
                    <span className="font-medium">{r.requestedByName}</span> vill lägga till dig i hushållet{" "}
                    <span className="font-medium">{r.householdName || "(namnlöst hushåll)"}</span>
                    {r.relation && <span className="text-slate"> som {HOUSEHOLD_RELATION_LABELS[r.relation].toLowerCase()}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <button
                      onClick={() => handleRespond(r.id, true)}
                      disabled={respondingId === r.id}
                      className="bd-btn flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full text-white bg-forest disabled:opacity-50"
                    >
                      <Check size={14} /> Godkänn
                    </button>
                    <button
                      onClick={() => handleRespond(r.id, false)}
                      disabled={respondingId === r.id}
                      className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full border border-line disabled:opacity-50"
                    >
                      <X size={14} /> Neka
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!household ? (
          <>
            <p className="text-sm mb-8 text-slate">
              Ett hushåll samlar dig och din familj hos Buddy — bra att ha om ni delar försäkringar
              eller vill att vi ska se er som en helhet.
            </p>

            <div className="bg-white rounded-2xl border border-line p-5">
              <Field label="Namn på hushållet (valfritt)">
                <input
                  className={inputClass}
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="T.ex. Familjen Karlsson"
                />
              </Field>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
              >
                <Home size={16} /> {creating ? "Skapar…" : "Skapa hushåll"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-line p-5 mb-4">
              <div className="text-xs mb-3 text-slate">MEDLEMMAR</div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{profile?.name || "Du"}</span>
                  <span className="text-xs text-slate">Du</span>
                </div>
                {household.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.name || "(Namn saknas)"}</span>
                    <span className="text-xs text-slate">{m.relation ? HOUSEHOLD_RELATION_LABELS[m.relation] : "–"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-line p-5 mb-3">
              <div className="text-xs mb-3 text-slate">LÄGG TILL FAMILJEMEDLEM</div>
              <Field label="Personnummer">
                <input
                  className={inputClass}
                  value={invitePersonnummer}
                  onChange={(e) => setInvitePersonnummer(e.target.value)}
                  placeholder="ÅÅÅÅMMDD-XXXX"
                />
              </Field>
              <Field label="Personens relation till hushållet">
                <PillGroup
                  options={["partner", "barn", "annan"] as const}
                  labels={HOUSEHOLD_RELATION_LABELS}
                  value={inviteRelation}
                  onChange={setInviteRelation}
                />
              </Field>
              {inviteError && <p className="text-sm text-red-600 mb-3">{inviteError}</p>}
              <button
                onClick={handleInvite}
                disabled={inviting || invitePersonnummer.trim().length < 6 || !inviteRelation}
                className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
              >
                {inviteSent ? (
                  <>
                    Förfrågan skickad <Check size={16} />
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> {inviting ? "Skickar…" : "Skicka förfrågan"}
                  </>
                )}
              </button>
              <p className="text-xs text-center mt-3 text-slate">
                Personen får en notis och behöver själv godkänna kopplingen.
              </p>
            </div>

            {sentHouseholdRequests.length > 0 && (
              <div className="bg-white rounded-2xl border border-line p-5 mb-6">
                <div className="text-xs mb-3 text-slate">SKICKADE FÖRFRÅGNINGAR</div>
                <div className="flex flex-col gap-3">
                  {sentHouseholdRequests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {r.personnummer}
                        {r.relation && <span className="text-slate"> · {HOUSEHOLD_RELATION_LABELS[r.relation]}</span>}
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color:
                            r.status === "approved"
                              ? "var(--color-forest)"
                              : r.status === "declined"
                                ? "var(--color-slate)"
                                : "var(--color-amber-deep)",
                        }}
                      >
                        {SENT_STATUS_LABELS[r.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setConfirmLeave(true)} className="w-full text-sm font-semibold text-slate text-center">
              Lämna hushållet
            </button>

            {confirmLeave && (
              <ConfirmDialog
                title="Lämna hushållet?"
                body="Du kopplas bort från hushållet men kan bli inbjuden igen senare."
                confirmLabel="Lämna"
                onConfirm={() => {
                  leaveHousehold();
                  setConfirmLeave(false);
                }}
                onCancel={() => setConfirmLeave(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
