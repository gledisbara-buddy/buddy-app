"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Home, UserPlus } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ConfirmDialog } from "@/components/Overlay";
import { Field, PillGroup, inputClass } from "@/components/onboarding/shared";
import { useBuddy } from "@/lib/buddy-context";
import { HOUSEHOLD_RELATION_LABELS, type HouseholdRelation } from "@/lib/household";

export function HouseholdView() {
  const router = useRouter();
  const { userType, loading, profile, household, createHousehold, joinHousehold, leaveHousehold } = useBuddy();
  const [copied, setCopied] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinRelation, setJoinRelation] = useState<HouseholdRelation | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (loading || !userType) return null;

  const handleCreate = async () => {
    setCreating(true);
    await createHousehold(householdName);
    setCreating(false);
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 4 || !joinRelation) return;
    setJoining(true);
    setJoinError(null);
    const ok = await joinHousehold(joinCode, joinRelation);
    setJoining(false);
    if (!ok) setJoinError("Ingen kod hittades. Kolla att den stämmer.");
  };

  const handleCopy = () => {
    if (!household) return;
    navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
  };

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-lg mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Hushåll</span>
        <h1 className="bd-display text-3xl mt-2 mb-2">{household ? "Ert hushåll" : "Skapa ett hushåll"}</h1>

        {!household ? (
          <>
            <p className="text-sm mb-8 text-slate">
              Ett hushåll samlar dig och din familj hos Buddy — bra att ha om ni delar försäkringar
              eller vill att vi ska se er som en helhet.
            </p>

            <div className="bg-white rounded-2xl border border-line p-5 mb-4">
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

            {!showJoin ? (
              <button onClick={() => setShowJoin(true)} className="text-sm font-semibold text-forest">
                Har du fått en kod av en familjemedlem?
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-line p-5">
                <Field label="Kod">
                  <input
                    className={inputClass}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="T.ex. KARL4821"
                  />
                </Field>
                <Field label="Din relation till hushållet">
                  <PillGroup
                    options={["partner", "barn", "annan"] as const}
                    labels={HOUSEHOLD_RELATION_LABELS}
                    value={joinRelation}
                    onChange={setJoinRelation}
                  />
                </Field>
                {joinError && <p className="text-sm text-red-600 mb-4">{joinError}</p>}
                <button
                  onClick={handleJoin}
                  disabled={joining || joinCode.trim().length < 4 || !joinRelation}
                  className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
                >
                  {joining ? "Går med…" : "Gå med i hushållet"}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm mb-8 text-slate">
              Dela koden nedan med en familjemedlem så kan de gå med i samma hushåll.
            </p>

            <div className="rounded-3xl p-6 mb-6 text-center bg-ink-deep">
              <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,.6)" }}>
                HUSHÅLLETS KOD
              </div>
              <div className="bd-display text-4xl text-white mb-5 tracking-wide">{household.inviteCode}</div>
              <button
                onClick={handleCopy}
                className="bd-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-[15px] bg-white"
                style={{ color: "var(--color-ink-deep)" }}
              >
                {copied ? (
                  <>
                    Kopierad! <Check size={16} />
                  </>
                ) : (
                  <>
                    Kopiera kod <Copy size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-line p-5 mb-3">
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

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-full font-semibold text-sm text-forest border border-line"
            >
              <UserPlus size={15} /> Lägg till familjemedlem
            </button>

            <button onClick={() => setConfirmLeave(true)} className="w-full text-sm font-semibold text-slate text-center">
              Lämna hushållet
            </button>

            {confirmLeave && (
              <ConfirmDialog
                title="Lämna hushållet?"
                body="Du kopplas bort från hushållet men kan gå med igen senare med en kod."
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
