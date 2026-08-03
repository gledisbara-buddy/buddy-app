"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Loader2, ShieldCheck, Star } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NeedsAnalysis } from "@/components/NeedsAnalysis";
import { Overlay } from "@/components/Overlay";
import { AutoFetchStep } from "@/components/onboarding/AutoFetchStep";
import { useBuddy } from "@/lib/buddy-context";
import { computeItemQuotes } from "@/lib/item-quotes";
import { isComparableItem, itemSummary, itemTitle } from "@/lib/items";
import type { NeedsKind } from "@/lib/needs";
import type { FetchableKind } from "@/lib/policy-fetch";
import { pickWinner, type Quote } from "@/lib/quote";

export function CompareFlow({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { items, policies, setPolicy } = useBuddy();
  const found = items.find((i) => i.id === itemId);
  const item = found && isComparableItem(found) ? found : undefined;

  useEffect(() => {
    if (!item) router.replace("/dashboard");
  }, [item, router]);

  // Försäkring-gruppens fem kategorier har auto-hämtning och får tre-kolumnsvyn
  // (Nuvarande/Billigast/Rekommendation). Behovsanalysen gäller därutöver även
  // Telekom/Kreditkort/El — de åtta kategorier som faktiskt har en jämförelsemotor.
  const FORSAKRING_KINDS: NeedsKind[] = ["boende", "bil", "ovrigt_fordon", "person", "djur"];
  const NEEDS_KINDS: NeedsKind[] = [...FORSAKRING_KINDS, "telekom", "kreditkort", "el"];
  const isForsakringGroup = !!item && (FORSAKRING_KINDS as string[]).includes(item.kind);
  const hasNeedsStep = !!item && (NEEDS_KINDS as string[]).includes(item.kind);
  const [phase, setPhase] = useState<"needs" | "loading" | "results">(hasNeedsStep ? "needs" : "loading");
  const [needs, setNeeds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAutoFetch, setShowAutoFetch] = useState(false);

  useEffect(() => {
    if (phase === "loading") {
      const t = setTimeout(() => setPhase("results"), 1700);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const quotes = useMemo(() => (item ? computeItemQuotes(item, needs) : []), [item, needs]);
  const winnerId = pickWinner(quotes);
  const winner = quotes.find((q) => q.id === winnerId);
  const cheapest = [...quotes].sort((a, b) => a.price - b.price)[0];
  const others = quotes.filter((q) => q.id !== winnerId);

  if (!item || !winner) return null;

  const label = itemTitle(item);
  const currentPolicy = policies[item.id];
  const current = currentPolicy?.source === "fetched" ? currentPolicy : undefined;

  const handleSign = (quote: Quote) => {
    setPolicy(item.id, { ...quote, source: "compared" });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen w-full">
      {phase === "needs" && (
        <>
          <div className="w-full flex items-center justify-between px-6 py-5">
            <Logo />
            <div className="w-6" />
          </div>
          <div className="flex items-center justify-center px-5">
            <div className="w-full max-w-lg bd-fade">
              <NeedsAnalysis
                kind={item.kind as NeedsKind}
                item={item}
                onBack={() => router.push("/dashboard")}
                onDone={(result) => {
                  setNeeds(result);
                  setPhase("loading");
                }}
              />
            </div>
          </div>
        </>
      )}

      {phase === "loading" && (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-forest">
            <Loader2 size={24} color="white" className="bd-spin" />
          </div>
          <div className="text-center">
            <div className="bd-display text-xl mb-1">Buddy jämför läget…</div>
            <div className="text-sm text-slate">Väger pris, självrisk och skydd</div>
          </div>
        </div>
      )}

      {phase === "results" && (
        <>
          <div className="flex items-center justify-between px-6 py-5 md:px-10">
            <Logo />
            <button onClick={() => router.push("/dashboard")} className="text-sm opacity-50 hover:opacity-100">
              Till översikten
            </button>
          </div>

          {isForsakringGroup ? (
            <div className="max-w-5xl mx-auto px-5 md:px-10 pb-14 bd-fade">
              <span className="bd-eyebrow">Din jämförelse</span>
              <h1 className="bd-display text-3xl mt-2 mb-2">Så ser dina alternativ ut</h1>
              <p className="text-sm mb-8 text-slate">
                Baserat på {label.toLowerCase()} — {itemSummary(item)}.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl border border-line p-6 flex flex-col h-full">
                  <span className="text-xs font-semibold tracking-wide mb-4 text-slate">DIN NUVARANDE</span>
                  {current ? (
                    <>
                      <div className="font-semibold text-base mb-1">{current.name}</div>
                      {current.omfattning && <div className="text-xs mb-4 text-slate">{current.omfattning}</div>}
                      <div className="bd-display text-2xl mb-4">
                        {current.price} kr <span className="text-xs font-sans font-normal text-slate">/mån</span>
                      </div>
                      <div className="flex flex-col gap-1.5 text-xs mt-auto pt-4 border-t border-line text-slate">
                        {current.selfRisk != null && <div>Självrisk {current.selfRisk.toLocaleString("sv-SE")} kr</div>}
                        {current.forfallodatum && <div>Förfaller {current.forfallodatum}</div>}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-frost-2">
                        <ShieldCheck size={18} className="text-slate" />
                      </div>
                      <p className="text-xs max-w-[22ch] text-slate">
                        Ingen nuvarande data — hämta automatiskt för att se hur det här ser ut mot vad du redan
                        betalar.
                      </p>
                      <button
                        onClick={() => setShowAutoFetch(true)}
                        className="bd-btn text-xs font-semibold px-4 py-2 rounded-full text-white bg-forest"
                      >
                        Hämta automatiskt
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-line p-6 flex flex-col h-full">
                  <span className="text-xs font-semibold tracking-wide mb-4 text-forest">BILLIGAST</span>
                  <div className="font-semibold text-base mb-1">{cheapest.name}</div>
                  <div className="text-xs mb-4 text-slate">Betyg {cheapest.rating} / 5</div>
                  <div className="bd-display text-2xl mb-4">
                    {cheapest.price} kr <span className="text-xs font-sans font-normal text-slate">/mån</span>
                  </div>
                  <div className="flex flex-col gap-2 mb-5">
                    {cheapest.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <Check size={13} className="mt-0.5 flex-none text-forest" /> {h}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSign(cheapest)}
                    className="bd-btn w-full mt-auto py-3 rounded-full font-semibold text-sm text-white bg-forest"
                  >
                    Teckna {cheapest.name} →
                  </button>
                </div>

                <div
                  className="rounded-3xl p-6 flex flex-col h-full relative bg-ink-deep"
                  style={{ boxShadow: "0 18px 40px rgba(91,141,239,.16)" }}
                >
                  <div
                    className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-forest"
                    style={{ color: "var(--color-ink-deep)" }}
                  >
                    <Star size={12} fill="var(--color-ink-deep)" /> Bäst för dig
                  </div>
                  <span className="text-xs font-semibold tracking-wide mt-2 mb-4" style={{ color: "rgba(255,255,255,.6)" }}>
                    VÅR REKOMMENDATION
                  </span>
                  <div className="bd-display text-xl text-white mb-1">{winner.name}</div>
                  <div className="text-xs mb-4" style={{ color: "rgba(255,255,255,.6)" }}>
                    Betyg {winner.rating} / 5
                  </div>
                  <div className="bd-display text-2xl text-white mb-4">
                    {winner.price} kr{" "}
                    <span className="text-xs font-sans font-normal" style={{ color: "rgba(255,255,255,.6)" }}>
                      /mån
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 mb-5">
                    {winner.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,.85)" }}>
                        <Check size={13} className="mt-0.5 flex-none text-forest-light" /> {h}
                      </div>
                    ))}
                  </div>
                  {winner.selfRisk != null && (
                    <div className="text-xs mb-4" style={{ color: "rgba(255,255,255,.55)" }}>
                      Självrisk: {winner.selfRisk.toLocaleString("sv-SE")} kr
                    </div>
                  )}
                  <button
                    onClick={() => handleSign(winner)}
                    className="bd-btn w-full mt-auto py-3 rounded-full font-semibold text-sm bg-white"
                    style={{ color: "var(--color-ink-deep)" }}
                  >
                    Teckna {winner.name} →
                  </button>
                </div>
              </div>

              <p className="text-xs text-center mt-8 text-slate">
                Bolagsnamn i den här prototypen är fiktiva exempel.
              </p>

              {showAutoFetch && (
                <Overlay onClose={() => setShowAutoFetch(false)}>
                  <AutoFetchStep
                    kind={item.kind as FetchableKind}
                    displayItem={item}
                    onBack={() => setShowAutoFetch(false)}
                    onDone={(_, quote) => {
                      setPolicy(item.id, quote);
                      setShowAutoFetch(false);
                    }}
                  />
                </Overlay>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-5 md:px-10 pb-14 bd-fade">
              <span className="bd-eyebrow">Din jämförelse</span>
              <h1 className="bd-display text-3xl mt-2 mb-2">Det här passar dig bäst</h1>
              <p className="text-sm mb-8 text-slate">
                Baserat på {label.toLowerCase()} — {itemSummary(item)}.
              </p>

              <div
                className="rounded-3xl p-6 md:p-7 mb-5 relative bg-ink-deep"
                style={{ boxShadow: "0 18px 40px rgba(91,141,239,.16)" }}
              >
                <div
                  className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-forest"
                  style={{ color: "var(--color-ink-deep)" }}
                >
                  <Star size={12} fill="var(--color-ink-deep)" /> Bäst för dig
                </div>
                <div className="flex items-start justify-between mb-4 mt-2">
                  <div>
                    <div className="bd-display text-2xl text-white mb-1">{winner.name}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,.6)" }}>
                      Betyg {winner.rating} / 5
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bd-display text-3xl text-white">{winner.price} kr</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,.6)" }}>
                      per månad
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-5">
                  {winner.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,.85)" }}>
                      <Check size={15} className="mt-0.5 flex-none text-forest-light" /> {h}
                    </div>
                  ))}
                </div>
                {winner.selfRisk != null && (
                  <div className="text-xs mb-5" style={{ color: "rgba(255,255,255,.55)" }}>
                    Självrisk: {winner.selfRisk.toLocaleString("sv-SE")} kr
                  </div>
                )}
                <button
                  onClick={() => handleSign(winner)}
                  className="bd-btn w-full py-3.5 rounded-full font-semibold text-[15px] bg-white"
                  style={{ color: "var(--color-ink-deep)" }}
                >
                  Teckna {winner.name} →
                </button>
              </div>

              <div className="text-sm font-semibold mb-3 text-slate">Andra alternativ</div>
              <div className="flex flex-col gap-3">
                {others.map((q) => {
                  const isOpen = expanded === q.id;
                  return (
                    <div key={q.id} className="bg-white rounded-2xl border border-line">
                      <button
                        onClick={() => setExpanded(isOpen ? null : q.id)}
                        className="w-full flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-frost-2">
                            <ShieldCheck size={16} className="text-forest" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-sm">{q.name}</div>
                            <div className="text-xs text-slate">
                              Betyg {q.rating} / 5
                              {q.selfRisk != null && <> · Självrisk {q.selfRisk.toLocaleString("sv-SE")} kr</>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-sm">{q.price} kr/mån</div>
                          {isOpen ? <ChevronUp size={16} className="text-slate" /> : <ChevronDown size={16} className="text-slate" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 bd-fade">
                          <div className="flex flex-col gap-2 mb-4">
                            {q.highlights.map((h, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <Check size={14} className="mt-0.5 flex-none text-forest" /> {h}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleSign(q)}
                            className="bd-btn w-full py-3 rounded-full font-semibold text-sm text-white bg-forest"
                          >
                            Teckna {q.name} →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-center mt-8 text-slate">
                Bolagsnamn i den här prototypen är fiktiva exempel.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
