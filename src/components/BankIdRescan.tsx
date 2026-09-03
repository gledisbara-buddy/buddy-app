"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Search, Smartphone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PageSkeleton } from "@/components/PageSkeleton";
import { MissingInsuranceFlagger } from "@/components/onboarding/MissingInsuranceFlagger";
import { itemSummary, itemTitle, type ComparableItem } from "@/lib/items";
import { fetchNewPolicies, type FetchableKind } from "@/lib/policy-fetch";
import type { Quote } from "@/lib/quote";
import { useBuddy } from "@/lib/buddy-context";

type Phase = "idle" | "waiting" | "fetching" | "result" | "none-found" | "flag-missing";

const FORSAKRING_KINDS: FetchableKind[] = ["boende", "bil", "ovrigt_fordon", "person", "djur"];

// "Identifiera dig igen" — för kunder som redan gjort den initiala
// BankID-importen (BankIdImport.tsx) men lagt till en försäkring hos ett
// bolag SEDAN dess. Letar bara efter kinds som inte redan finns bland
// items, se fetchNewPolicies i policy-fetch.ts.
export function BankIdRescan() {
  const router = useRouter();
  const { userType, loading: authLoading, items, addItems, setPolicy } = useBuddy();
  const [phase, setPhase] = useState<Phase>("idle");
  const [found, setFound] = useState<{ item: ComparableItem; quote: Quote }[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !userType) router.replace("/kom-igang");
  }, [authLoading, userType, router]);

  if (authLoading) return <PageSkeleton />;
  if (!userType) return null;

  const existingKinds = Array.from(new Set(items.map((i) => i.kind))).filter((k): k is FetchableKind =>
    FORSAKRING_KINDS.includes(k as FetchableKind)
  );

  const startBankId = () => {
    setPhase("waiting");
    setTimeout(() => {
      setPhase("fetching");
      fetchNewPolicies(existingKinds).then((data) => {
        setFound(data);
        setChecked(new Set(data.map((d) => d.item.id)));
        setPhase(data.length > 0 ? "result" : "none-found");
      });
    }, 1800);
  };

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelectedAndClose = async () => {
    const selected = found.filter((f) => checked.has(f.item.id));
    await addItems(selected.map((f) => f.item));
    selected.forEach((f) => setPolicy(f.item.id, f.quote));
    router.push("/dashboard?imported=1");
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-between px-6 py-5">
        <Logo />
        <button onClick={() => router.push("/dashboard")} className="text-sm font-semibold text-slate">
          Avbryt
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md text-center bd-fade">
          {phase === "idle" && (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-forest mx-auto mb-5">
                <Search size={26} color="white" />
              </div>
              <h1 className="bd-display text-2xl mb-2">Identifiera dig igen</h1>
              <p className="text-sm mb-6 text-slate">
                Har du tecknat en ny försäkring sen sist? Vi letar efter sånt som inte redan finns hos dig i Buddy.
              </p>
              <button
                onClick={startBankId}
                className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest mb-3"
              >
                <Smartphone size={17} /> Starta Mobilt BankID
              </button>
              <p className="text-xs text-slate">Simulerad identifiering i den här prototypen.</p>
            </>
          )}

          {phase === "waiting" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="bd-pulse w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
                <Smartphone size={26} color="white" />
              </div>
              <div>
                <div className="font-semibold text-[15px] mb-1">Väntar på signering…</div>
                <div className="text-sm text-slate">Öppna BankID-appen i din mobil</div>
              </div>
              <Loader2 size={18} className="bd-spin text-forest" />
              <p className="text-xs text-slate">Simulerad identifiering i den här prototypen.</p>
            </div>
          )}

          {phase === "fetching" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
                <Loader2 size={26} color="white" className="bd-spin" />
              </div>
              <div>
                <div className="font-semibold text-[15px] mb-1">Letar efter nya försäkringar…</div>
                <div className="text-sm text-slate">Jämför mot det du redan har hos Buddy</div>
              </div>
              <p className="text-xs text-slate">Simulerad identifiering i den här prototypen.</p>
            </div>
          )}

          {phase === "result" && (
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1 text-forest">
                <Check size={18} />
                <span className="text-sm font-semibold">
                  Vi hittade {found.length} {found.length === 1 ? "ny försäkring" : "nya försäkringar"}
                </span>
              </div>
              <p className="text-xs mb-4 text-slate">Simulerad identifiering i den här prototypen — bolag och priser nedan är exempeldata.</p>
              <div className="flex flex-col gap-3 mb-6">
                {found.map(({ item, quote }) => {
                  const active = checked.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.id)}
                      className="w-full text-left bg-white rounded-2xl border p-5"
                      style={{ borderColor: active ? "var(--color-forest)" : "var(--color-line)" }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="font-semibold text-[15px]">{itemTitle(item)}</div>
                        <div
                          className="w-5 h-5 rounded-md border flex items-center justify-center flex-none"
                          style={{
                            borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                            background: active ? "var(--color-forest)" : "white",
                          }}
                        >
                          {active && <Check size={13} color="white" />}
                        </div>
                      </div>
                      <div className="text-xs mb-4 text-slate">{itemSummary(item)}</div>
                      <div className="pt-4 border-t border-line flex items-center justify-between">
                        <div className="font-semibold text-sm">{quote.name}</div>
                        <div className="text-right">
                          <div className="bd-display text-lg text-forest">{quote.price} kr</div>
                          <div className="text-xs text-slate">per månad</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={addSelectedAndClose}
                disabled={checked.size === 0}
                className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-50"
              >
                Lägg till {checked.size} markerade <ArrowRight size={16} />
              </button>
            </div>
          )}

          {phase === "none-found" && (
            <>
              <h1 className="bd-display text-2xl mb-2">Inget nytt hittades</h1>
              <p className="text-sm mb-6 text-slate">
                Vi hittade inga försäkringar utöver det du redan har i Buddy. Saknas något ändå kan du berätta det
                för oss så hämtar en handläggare in det manuellt.
              </p>
              <button
                onClick={() => setPhase("flag-missing")}
                className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest mb-3"
              >
                Berätta vad som saknas <ArrowRight size={16} />
              </button>
              <button onClick={() => router.push("/dashboard")} className="w-full text-sm font-semibold py-2 text-slate">
                Inget att lägga till
              </button>
            </>
          )}

          {phase === "flag-missing" && (
            <div className="text-left">
              <MissingInsuranceFlagger
                title="Vad saknas?"
                intro="Berätta vilken typ av försäkring det gäller så hämtar Buddy in den åt dig."
                doneLabel="Klar"
                onDone={() => router.push("/dashboard")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
