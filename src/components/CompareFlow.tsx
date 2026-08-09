"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck, Star, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NeedsAnalysis } from "@/components/NeedsAnalysis";
import { Overlay } from "@/components/Overlay";
import { AutoFetchStep } from "@/components/onboarding/AutoFetchStep";
import { useBuddy } from "@/lib/buddy-context";
import { computeItemQuotes } from "@/lib/item-quotes";
import { isComparableItem, itemSummary, itemTitle } from "@/lib/items";
import { getAvailableNeedIds, NEED_LABELS, type NeedsKind } from "@/lib/needs";
import type { FetchableKind } from "@/lib/policy-fetch";
import { pickWinner, type Quote } from "@/lib/quote";

// Avtalsdetaljer för det avancerade jämförelseläget — bara satt för
// Försäkring-gruppens offerter, så komponenten renderar inget om fälten saknas.
function AdvancedDetails({ quote, dark }: { quote: Quote; dark?: boolean }) {
  if (!quote.karenstid && !quote.ersattningstak && !quote.bindningstid && !quote.uppsagningstid && !quote.undantag) {
    return null;
  }
  const mutedColor = dark ? "rgba(255,255,255,.6)" : "var(--color-slate)";
  const textColor = dark ? "rgba(255,255,255,.9)" : "var(--color-ink)";
  const fields: [string, string | undefined][] = [
    ["Karenstid", quote.karenstid],
    ["Ersättningstak", quote.ersattningstak],
    ["Bindningstid", quote.bindningstid],
    ["Uppsägningstid", quote.uppsagningstid],
  ];
  return (
    <div
      className="text-xs mb-5 pt-4 border-t"
      style={{ borderColor: dark ? "rgba(255,255,255,.15)" : "var(--color-line)" }}
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-3">
        {fields.map(
          ([label, value]) =>
            value && (
              <div key={label}>
                <div className="mb-0.5" style={{ color: mutedColor }}>
                  {label}
                </div>
                <div className="font-medium" style={{ color: textColor }}>
                  {value}
                </div>
              </div>
            )
        )}
      </div>
      {quote.undantag && quote.undantag.length > 0 && (
        <div>
          <div className="mb-0.5" style={{ color: mutedColor }}>
            Undantag
          </div>
          <div style={{ color: textColor }}>{quote.undantag.join(", ")}</div>
        </div>
      )}
    </div>
  );
}

// Visar varför just det här bolaget föreslogs, baserat på svaren i
// behovsanalysen — bara satt när minst ett av kundens behov faktiskt
// matchar bolagets styrkor (se NEED_COMPANY_MATCH i item-quotes.ts).
function MatchedNeedsLine({ quote, labels, dark }: { quote: Quote; labels: Record<string, string>; dark?: boolean }) {
  if (!quote.matchedNeeds || quote.matchedNeeds.length === 0) return null;
  const text = quote.matchedNeeds.map((id) => labels[id] ?? id).join(", ");
  return (
    <div className="text-xs mb-4 flex items-start gap-1.5" style={{ color: dark ? "rgba(255,255,255,.85)" : "var(--color-forest)" }}>
      <Star size={12} className="mt-0.5 flex-none" fill="currentColor" />
      <span>Matchar dina behov: {text}</span>
    </div>
  );
}

// Fullständig jämförelsetabell för Försäkring-gruppen — med fyra bolag räcker
// inte längre de tre korten ovanför för att visa alla alternativ på en gång.
function ComparisonTable({
  quotes,
  current,
  winnerId,
  cheapestId,
  detailLevel,
  needLabels,
  onSign,
}: {
  quotes: Quote[];
  current?: Quote;
  winnerId: string;
  cheapestId: string;
  detailLevel: "enkel" | "avancerat";
  needLabels: Record<string, string>;
  onSign: (quote: Quote) => void;
}) {
  const rows: { quote: Quote; isCurrent?: boolean }[] = [
    ...(current ? [{ quote: current, isCurrent: true }] : []),
    ...quotes.map((quote) => ({ quote })),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="text-left text-xs text-slate">
            <th className="py-2 pr-3 font-semibold">Bolag</th>
            <th className="py-2 px-3 font-semibold">Betyg</th>
            <th className="py-2 px-3 font-semibold">Pris/mån</th>
            {detailLevel === "avancerat" && (
              <>
                <th className="py-2 px-3 font-semibold">Självrisk</th>
                <th className="py-2 px-3 font-semibold">Karenstid</th>
                <th className="py-2 px-3 font-semibold">Ersättningstak</th>
                <th className="py-2 px-3 font-semibold">Bindningstid</th>
                <th className="py-2 px-3 font-semibold">Uppsägningstid</th>
                <th className="py-2 px-3 font-semibold">Undantag</th>
                <th className="py-2 px-3 font-semibold">Matchar behov</th>
              </>
            )}
            <th className="py-2 pl-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ quote, isCurrent }) => {
            const isWinner = !isCurrent && quote.id === winnerId;
            const isCheapest = !isCurrent && quote.id === cheapestId;
            return (
              <tr key={quote.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <div className="font-semibold">{isCurrent ? "Din nuvarande" : quote.name}</div>
                  {isCurrent && <div className="text-xs text-slate">{quote.name}</div>}
                  {isWinner && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold mt-0.5 text-forest">
                      <Star size={11} fill="currentColor" /> Bäst för dig
                    </span>
                  )}
                  {isCheapest && !isWinner && (
                    <span className="inline-block text-xs font-semibold mt-0.5 text-forest">Billigast</span>
                  )}
                </td>
                <td className="py-3 px-3 text-slate">{quote.rating != null ? `${quote.rating} / 5` : "–"}</td>
                <td className="py-3 px-3 font-semibold">{quote.price} kr</td>
                {detailLevel === "avancerat" && (
                  <>
                    <td className="py-3 px-3 text-slate">
                      {quote.selfRisk != null ? `${quote.selfRisk.toLocaleString("sv-SE")} kr` : "–"}
                    </td>
                    <td className="py-3 px-3 text-slate">{quote.karenstid ?? "–"}</td>
                    <td className="py-3 px-3 text-slate">{quote.ersattningstak ?? "–"}</td>
                    <td className="py-3 px-3 text-slate">{quote.bindningstid ?? "–"}</td>
                    <td className="py-3 px-3 text-slate">{quote.uppsagningstid ?? "–"}</td>
                    <td className="py-3 px-3 text-slate max-w-[220px]">{quote.undantag?.join(", ") ?? "–"}</td>
                    <td className="py-3 px-3 text-slate max-w-[200px]">
                      {quote.matchedNeeds && quote.matchedNeeds.length > 0
                        ? quote.matchedNeeds.map((id) => needLabels[id] ?? id).join(", ")
                        : "–"}
                    </td>
                  </>
                )}
                <td className="py-3 pl-3 text-right">
                  {!isCurrent && (
                    <button
                      onClick={() => onSign(quote)}
                      className="bd-btn text-xs font-semibold px-3 py-1.5 rounded-full text-white bg-forest whitespace-nowrap"
                    >
                      Teckna
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CompareFlow({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { items, policies, setPolicy, itemNeeds, saveItemNeeds } = useBuddy();
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
  // Tidigare sparade behov, omvaliderade mot sakens aktuella undertyp — en
  // sparad "resa"-post kan t.ex. ha blivit ogiltig om boendet ändrats till
  // magasinering sedan sist.
  const initialNeeds =
    item && hasNeedsStep
      ? (itemNeeds[item.id] ?? []).filter((id) => getAvailableNeedIds(item.kind as NeedsKind, item).includes(id))
      : [];
  const [phase, setPhase] = useState<"needs" | "loading" | "results">(hasNeedsStep ? "needs" : "loading");
  const [needs, setNeeds] = useState<string[]>(initialNeeds);
  const [showAutoFetch, setShowAutoFetch] = useState(false);
  const [detailLevel, setDetailLevel] = useState<"enkel" | "avancerat">("enkel");
  const [showTable, setShowTable] = useState(false);

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
                initialConfirmed={initialNeeds.length > 0 ? initialNeeds : undefined}
                onDone={(result) => {
                  setNeeds(result);
                  saveItemNeeds(item.id, result);
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
              <p className="text-sm mb-5 text-slate">
                Baserat på {label.toLowerCase()} — {itemSummary(item)}.
              </p>

              <div className="flex items-center gap-1 mb-6 p-1 rounded-full w-fit bg-frost-2">
                <button
                  onClick={() => setDetailLevel("enkel")}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={
                    detailLevel === "enkel"
                      ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                      : { color: "var(--color-slate)" }
                  }
                >
                  Enkel
                </button>
                <button
                  onClick={() => setDetailLevel("avancerat")}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={
                    detailLevel === "avancerat"
                      ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                      : { color: "var(--color-slate)" }
                  }
                >
                  Avancerat
                </button>
              </div>

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
                      <div className="flex flex-col gap-1.5 text-xs text-slate">
                        {current.selfRisk != null && <div>Självrisk {current.selfRisk.toLocaleString("sv-SE")} kr</div>}
                        {current.forfallodatum && <div>Förfaller {current.forfallodatum}</div>}
                      </div>
                      <div className="mt-auto">{detailLevel === "avancerat" && <AdvancedDetails quote={current} />}</div>
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
                  {detailLevel === "avancerat" && <AdvancedDetails quote={cheapest} />}
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
                  <MatchedNeedsLine quote={winner} labels={NEED_LABELS[item.kind as NeedsKind]} dark />
                  {winner.selfRisk != null && (
                    <div className="text-xs mb-4" style={{ color: "rgba(255,255,255,.55)" }}>
                      Självrisk: {winner.selfRisk.toLocaleString("sv-SE")} kr
                    </div>
                  )}
                  {detailLevel === "avancerat" && <AdvancedDetails quote={winner} dark />}
                  <button
                    onClick={() => handleSign(winner)}
                    className="bd-btn w-full mt-auto py-3 rounded-full font-semibold text-sm bg-white"
                    style={{ color: "var(--color-ink-deep)" }}
                  >
                    Teckna {winner.name} →
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowTable((v) => !v)}
                  className="text-xs font-semibold text-forest hover:opacity-80"
                >
                  {showTable ? "Dölj tabellen" : "Se alla fyra alternativ i en tabell"}
                </button>
                {showTable && (
                  <div className="mt-4 bg-white rounded-3xl border border-line p-5 bd-fade">
                    <ComparisonTable
                      quotes={quotes}
                      current={current}
                      winnerId={winnerId}
                      cheapestId={cheapest.id}
                      detailLevel={detailLevel}
                      needLabels={NEED_LABELS[item.kind as NeedsKind]}
                      onSign={handleSign}
                    />
                  </div>
                )}
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

              {item.kind === "el" && (
                <div className="rounded-2xl p-4 mb-6 flex items-start gap-3 bg-frost-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-white">
                    <Zap size={15} className="text-amber-deep" />
                  </div>
                  <p className="text-xs text-ink">
                    {item.avtalstyp === "fast"
                      ? "Du har fast pris, så det spelar ingen roll när på dygnet du drar ström — priset är detsamma oavsett tid."
                      : "Med rörligt pris är elen ofta billigast natt och tidig morgon (ca 02–06) och dyrast under kvällstopparna (ca 17–19). Lägg tunga sysslor som tvätt, diskmaskin och laddning på natten för att sänka snittpriset."}
                  </p>
                </div>
              )}

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
                <MatchedNeedsLine quote={winner} labels={NEED_LABELS[item.kind as NeedsKind]} dark />
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

              <div>
                <button
                  onClick={() => setShowTable((v) => !v)}
                  className="text-xs font-semibold text-forest hover:opacity-80"
                >
                  {showTable ? "Dölj tabellen" : `Se alla ${quotes.length} alternativ i en tabell`}
                </button>
                {showTable && (
                  <div className="mt-4 bg-white rounded-3xl border border-line p-5 bd-fade">
                    <ComparisonTable
                      quotes={quotes}
                      winnerId={winnerId}
                      cheapestId={cheapest.id}
                      detailLevel="enkel"
                      needLabels={NEED_LABELS[item.kind as NeedsKind]}
                      onSign={handleSign}
                    />
                  </div>
                )}
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
