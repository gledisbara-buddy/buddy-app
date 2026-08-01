"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Loader2, ShieldCheck, Star } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useBuddy } from "@/lib/buddy-context";
import { computeItemQuotes } from "@/lib/item-quotes";
import { isComparableItem, itemSummary, itemTitle } from "@/lib/items";
import { BIL_EXTRA_OPTIONS, EXTRA_OPTIONS, pickWinner, type Quote } from "@/lib/quote";

export function CompareFlow({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { items, profile, setPolicy } = useBuddy();
  const found = items.find((i) => i.id === itemId);
  const item = found && isComparableItem(found) ? found : undefined;

  useEffect(() => {
    if (!item) router.replace("/dashboard");
  }, [item, router]);

  const hasExtrasStep = item?.kind === "boende" || item?.kind === "bil";
  const [phase, setPhase] = useState<"extras" | "loading" | "results">(hasExtrasStep ? "extras" : "loading");
  const [extras, setExtras] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (phase === "loading") {
      const t = setTimeout(() => setPhase("results"), 1700);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const quotes = useMemo(() => (item ? computeItemQuotes(item, extras) : []), [item, extras]);
  const winnerId = pickWinner(quotes, profile?.priority ?? null);
  const winner = quotes.find((q) => q.id === winnerId);
  const others = quotes.filter((q) => q.id !== winnerId);

  if (!item || !winner) return null;

  const label = itemTitle(item);
  const extraOptions = item.kind === "boende" ? EXTRA_OPTIONS : item.kind === "bil" ? BIL_EXTRA_OPTIONS : [];

  const toggleExtra = (id: string) =>
    setExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSign = (quote: Quote) => {
    setPolicy(item.id, { ...quote, source: "compared" });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen w-full">
      {phase === "extras" && (
        <>
          <div className="w-full flex items-center justify-between px-6 py-5">
            <Logo />
            <div className="w-6" />
          </div>
          <div className="flex items-center justify-center px-5">
            <div className="w-full max-w-lg bd-fade">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100"
              >
                <ArrowLeft size={15} /> Tillbaka
              </button>
              <span className="bd-eyebrow">
                {label} · {itemSummary(item)}
              </span>
              <h1 className="bd-display text-2xl md:text-3xl mt-3 mb-2">Vill du lägga till något extra?</h1>
              <p className="text-sm mb-6 text-slate">Valfritt.</p>
              <div className="grid grid-cols-2 gap-3">
                {extraOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = extras.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleExtra(opt.id)}
                      className="bd-card p-4 rounded-2xl border text-left flex flex-col gap-3"
                      style={{
                        borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                        background: active ? "var(--color-frost-2)" : "white",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: active ? "var(--color-forest)" : "var(--color-frost)" }}
                      >
                        <Icon size={16} color={active ? "white" : "var(--color-forest)"} />
                      </div>
                      <div className="text-sm font-medium leading-tight">{opt.label}</div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPhase("loading")}
                className="bd-btn w-full mt-7 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
              >
                Visa min jämförelse <ArrowRight size={16} />
              </button>
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
          <div className="max-w-2xl mx-auto px-5 md:px-10 pb-14 bd-fade">
            <span className="bd-eyebrow">Din jämförelse</span>
            <h1 className="bd-display text-3xl mt-2 mb-2">Det här passar dig bäst</h1>
            <p className="text-sm mb-8 text-slate">
              Baserat på {label.toLowerCase()} — {itemSummary(item)}.
            </p>

            <div
              className="rounded-3xl p-6 md:p-7 mb-5 relative bg-ink"
              style={{ boxShadow: "0 18px 40px rgba(31,77,62,.14)" }}
            >
              <div
                className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-amber"
                style={{ color: "var(--color-ink)" }}
              >
                <Star size={12} fill="var(--color-ink)" /> Bäst för dig
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
                    <Check size={15} className="mt-0.5 flex-none text-amber" /> {h}
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
                style={{ color: "var(--color-ink)" }}
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
        </>
      )}
    </div>
  );
}
