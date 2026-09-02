"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleDot, ShieldCheck, Star, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BuddyStage } from "@/components/BuddyStage";
import type { BuddyEmotion } from "@/components/Buddy";
import { NeedsAnalysis } from "@/components/NeedsAnalysis";
import { Overlay } from "@/components/Overlay";
import { FullmaktSigning } from "@/components/FullmaktSigning";
import { AutoFetchStep } from "@/components/onboarding/AutoFetchStep";
import { CoverageMap } from "@/components/CoverageMap";
import { BoolPill, Field, PillGroup, inputClass } from "@/components/onboarding/shared";
import { useBuddy, type CheckoutInfo } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";
import { sendTransactionalEmail } from "@/lib/email";
import { formatSwedishDate } from "@/lib/dates";
import { computeItemQuotes } from "@/lib/item-quotes";
import { HALSODEKLARATION_SKYDD, isComparableItem, itemSummary, itemTitle } from "@/lib/items";
import { getAvailableNeedIds, NEED_LABELS, type NeedsKind } from "@/lib/needs";
import type { FetchableKind } from "@/lib/policy-fetch";
import { effectiveQuote, pickWinner, type Quote } from "@/lib/quote";

type Betalningsmetod = CheckoutInfo["betalningsmetod"];

const BETALNINGSMETOD_LABELS: Record<Betalningsmetod, string> = {
  autogiro: "Autogiro",
  faktura: "Faktura",
  efaktura: "E-faktura",
};

function CheckoutForm({
  quoteName,
  name,
  setName,
  personnummer,
  setPersonnummer,
  betalningsmetod,
  setBetalningsmetod,
  hasOldPolicy,
  setHasOldPolicy,
  oldBolag,
  setOldBolag,
  oldAvtalsnummer,
  setOldAvtalsnummer,
  needsHalsodeklaration,
  roker,
  setRoker,
  sjukskrivenSenaste5Ar,
  setSjukskrivenSenaste5Ar,
  pagaendeBehandling,
  setPagaendeBehandling,
  tidigareAvslag,
  setTidigareAvslag,
  onSubmit,
  onBack,
}: {
  quoteName: string;
  name: string;
  setName: (v: string) => void;
  personnummer: string;
  setPersonnummer: (v: string) => void;
  betalningsmetod: Betalningsmetod | null;
  setBetalningsmetod: (v: Betalningsmetod) => void;
  hasOldPolicy: boolean | null;
  setHasOldPolicy: (v: boolean) => void;
  oldBolag: string;
  setOldBolag: (v: string) => void;
  oldAvtalsnummer: string;
  setOldAvtalsnummer: (v: string) => void;
  needsHalsodeklaration: boolean;
  roker: boolean | null;
  setRoker: (v: boolean) => void;
  sjukskrivenSenaste5Ar: boolean | null;
  setSjukskrivenSenaste5Ar: (v: boolean) => void;
  pagaendeBehandling: boolean | null;
  setPagaendeBehandling: (v: boolean) => void;
  tidigareAvslag: boolean | null;
  setTidigareAvslag: (v: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const valid =
    name.trim().length > 0 &&
    personnummer.trim().length >= 10 &&
    !!betalningsmetod &&
    hasOldPolicy !== null &&
    (!hasOldPolicy || oldBolag.trim().length > 0) &&
    (!needsHalsodeklaration ||
      (roker !== null && sjukskrivenSenaste5Ar !== null && pagaendeBehandling !== null && tidigareAvslag !== null));

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
        <ArrowLeft size={15} /> Tillbaka
      </button>
      <span className="bd-eyebrow">Teckna</span>
      <h1 className="bd-display text-2xl mt-3 mb-2">Dina uppgifter</h1>
      <p className="text-sm mb-6 text-slate">Sista steget innan du tecknar {quoteName}.</p>

      <div className="bg-white rounded-2xl border border-line p-6">
        <Field label="Namn">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="T.ex. Sam" />
        </Field>
        <Field label="Personnummer">
          <input
            className={inputClass}
            value={personnummer}
            onChange={(e) => setPersonnummer(e.target.value)}
            placeholder="ÅÅÅÅMMDD-XXXX"
          />
        </Field>
        <Field label="Betalningsmetod">
          <PillGroup
            options={["autogiro", "faktura", "efaktura"] as const}
            labels={BETALNINGSMETOD_LABELS}
            value={betalningsmetod}
            onChange={setBetalningsmetod}
          />
        </Field>
        <Field label="Har du en nuvarande försäkring som ska ersättas?">
          <BoolPill value={hasOldPolicy} onChange={setHasOldPolicy} />
        </Field>
        {hasOldPolicy && (
          <>
            <Field label="Vilket bolag?">
              <input className={inputClass} value={oldBolag} onChange={(e) => setOldBolag(e.target.value)} placeholder="T.ex. Hemgrund" />
            </Field>
            <Field label="Avtalsnummer (valfritt)">
              <input className={inputClass} value={oldAvtalsnummer} onChange={(e) => setOldAvtalsnummer(e.target.value)} />
            </Field>
          </>
        )}
      </div>

      {needsHalsodeklaration && (
        <div className="bg-white rounded-2xl border border-line p-6 mt-4">
          <div className="text-sm font-semibold mb-1">Hälsodeklaration</div>
          <p className="text-xs mb-4 text-slate">
            Det här påverkar om bolaget godkänner avtalet, inte om du kan jämföra priser — därför frågar vi först nu,
            inte tidigare i jämförelsen.
          </p>
          <Field label="Röker eller snusar du?">
            <BoolPill value={roker} onChange={setRoker} />
          </Field>
          <Field label="Har du varit sjukskriven mer än 14 dagar i följd senaste 5 åren?">
            <BoolPill value={sjukskrivenSenaste5Ar} onChange={setSjukskrivenSenaste5Ar} />
          </Field>
          <Field label="Har du någon pågående behandling, medicinering eller utredning?">
            <BoolPill value={pagaendeBehandling} onChange={setPagaendeBehandling} />
          </Field>
          <Field label="Har du fått avslag eller förhöjd premie på en försäkring tidigare?">
            <BoolPill value={tidigareAvslag} onChange={setTidigareAvslag} />
          </Field>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!valid}
        className="bd-btn w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
      >
        Fortsätt <ArrowRight size={16} />
      </button>
    </>
  );
}

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
  const { items, policies, setPolicy, updateItem, itemNeeds, saveItemNeeds, profile } = useBuddy();
  const found = items.find((i) => i.id === itemId);
  const item = found && isComparableItem(found) ? found : undefined;

  useEffect(() => {
    if (!item) router.replace("/dashboard");
  }, [item, router]);

  // Försäkring-gruppens fem kategorier plus kreditkort/el har alla riktig
  // auto-hämtning (policy-fetch.ts:s FetchableKind) och får därför samma
  // tre-kolumnsvy (Nuvarande/Billigast/Rekommendation) — det är
  // auto-hämtningen som avgör layouten, inte gruppen i sig. Telekom är
  // medvetet undantaget: den har sitt eget operatörsuppslag istället för
  // ett "hämta befintligt avtal"-flöde, så en "DIN NUVARANDE"-kolumn
  // skulle bara visa ett tomt läge med en knapp som aldrig fungerar för
  // just den kategorin. Behovsanalysen gäller därutöver även Telekom — de
  // åtta kategorier som faktiskt har en jämförelsemotor.
  const FORSAKRING_KINDS: NeedsKind[] = ["boende", "bil", "ovrigt_fordon", "person", "djur"];
  const THREE_COLUMN_KINDS: NeedsKind[] = [...FORSAKRING_KINDS, "kreditkort", "el"];
  const NEEDS_KINDS: NeedsKind[] = [...FORSAKRING_KINDS, "telekom", "kreditkort", "el"];
  const hasThreeColumnLayout = !!item && (THREE_COLUMN_KINDS as string[]).includes(item.kind);
  const hasNeedsStep = !!item && (NEEDS_KINDS as string[]).includes(item.kind);
  // Tidigare sparade behov, omvaliderade mot sakens aktuella undertyp — en
  // sparad "resa"-post kan t.ex. ha blivit ogiltig om boendet ändrats till
  // magasinering sedan sist.
  const initialNeeds =
    item && hasNeedsStep
      ? (itemNeeds[item.id] ?? []).filter((id) => getAvailableNeedIds(item.kind as NeedsKind, item).includes(id))
      : [];
  // Del H i docs/kundresa-v2-steg2-plan.md: varje jämförelse börjar med
  // forken "bara den här" vs "hela lösningen" — "hela lösningen" leder
  // direkt vidare till bokningsflödet istället för att fortsätta här.
  const [phase, setPhase] = useState<"fork" | "needs" | "loading" | "results" | "checkout" | "cancellation" | "signed">(
    "fork"
  );
  const [signedQuote, setSignedQuote] = useState<Quote | null>(null);
  const [needs, setNeeds] = useState<string[]>(initialNeeds);
  const [showAutoFetch, setShowAutoFetch] = useState(false);
  const [detailLevel, setDetailLevel] = useState<"enkel" | "avancerat">("enkel");
  const [showTable, setShowTable] = useState(false);

  // Insamlat i checkout/cancellation-faserna, skrivet i ett enda setPolicy-anrop
  // när flödet är klart (se finalizeSign) — ingen delvis jsonb-merge behövs.
  const [pendingQuote, setPendingQuote] = useState<Quote | null>(null);
  const [checkoutName, setCheckoutName] = useState(profile?.name ?? "");
  const [checkoutPersonnummer, setCheckoutPersonnummer] = useState(profile?.personnummer ?? "");
  const [betalningsmetod, setBetalningsmetod] = useState<Betalningsmetod | null>(null);
  const [hasOldPolicy, setHasOldPolicy] = useState<boolean | null>(null);
  const [oldBolag, setOldBolag] = useState("");
  const [oldAvtalsnummer, setOldAvtalsnummer] = useState("");
  const [wantsCancellationHelp, setWantsCancellationHelp] = useState<boolean | undefined>(undefined);
  // Bara relevant för personförsäkringar i HALSODEKLARATION_SKYDD — ställs
  // här (vid tecknande) snarare än i den indikativa jämförelsen, se
  // Halsodeklaration-typen i buddy-context.tsx för varför.
  const [roker, setRoker] = useState<boolean | null>(null);
  const [sjukskrivenSenaste5Ar, setSjukskrivenSenaste5Ar] = useState<boolean | null>(null);
  const [pagaendeBehandling, setPagaendeBehandling] = useState<boolean | null>(null);
  const [tidigareAvslag, setTidigareAvslag] = useState<boolean | null>(null);

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
  // Genväg för täckningskartan (CoverageMap) — slipper skriva in adressen
  // igen om kunden redan lagt in sitt boende.
  const homeItem = items.find((i) => i.kind === "boende");
  const homeAddress = homeItem && "adress" in homeItem ? `${homeItem.adress}, ${homeItem.ort}` : undefined;
  const needsHalsodeklaration =
    item.kind === "person" && item.onskatSkydd.some((s) => HALSODEKLARATION_SKYDD.includes(s));

  // Buddy-avatarens humör, styrt av flödets tillstånd — se BUDDY-SPEC.md.
  // "En faktisk besparing" återanvänder samma definition som redan finns
  // för spara-mejlet nedan (current = en auto-hämtad, inte jämförd offert),
  // inte en ny egen tröskel — annars kan "firar" och mejlet säga olika saker.
  const isSaving = !!(current && winner.price < current.price);
  const isSignedSaving = !!(signedQuote && current && signedQuote.price < current.price);
  const emotion: BuddyEmotion =
    phase === "fork"
      ? "halsar" // kunden landar i jämförelseflödet
      : phase === "needs"
        ? "nyfiken" // Buddy ställer en fråga i formuläret
        : phase === "loading"
          ? "raknar" // vi hämtar priser
          : phase === "results"
            ? isSaving
              ? "firar" // en faktisk besparing — inte varje resultat
              : "vilar"
            : phase === "checkout" || phase === "cancellation"
              ? "nyfiken" // fler frågor innan tecknandet är klart
              : phase === "signed"
                ? isSignedSaving
                  ? "firar"
                  : "vilar"
                : "vilar";

  const handleSign = (quote: Quote) => {
    setPendingQuote(quote);
    setPhase("checkout");
  };

  const finalizeSign = (cancellationHelp?: boolean) => {
    if (!pendingQuote || !betalningsmetod) return;
    // item-quotes.ts:s jämförelseerbjudanden har inget eget forfallodatum
    // (bara auto-hämtade offerter från policy-fetch.ts har det) — utan ett
    // eget datum skulle den här nytecknade offerten aldrig kunna framdateras
    // om kunden jämför igen senare. 12 månader är samma standardlängd som
    // ett vanligt svenskt försäkringsår.
    const oneYearOut = new Date();
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
    const newQuote: Quote = {
      ...pendingQuote,
      source: "compared",
      forfallodatum: pendingQuote.forfallodatum ?? formatSwedishDate(oneYearOut),
    };
    // Har saken redan en spårad policy med känt forfallodatum (auto-hämtad
    // eller tidigare tecknad via Buddy) framdateras den nya offerten till
    // dess istället för att aktiveras direkt — se computeMoveStatus i
    // quote.ts. effectiveQuote hanterar fallet att en flytt redan pågår.
    const oldQuote = currentPolicy ? effectiveQuote(currentPolicy) : undefined;
    const quoteToSave: Quote = oldQuote?.forfallodatum
      ? { ...oldQuote, source: "compared", pendingQuote: newQuote }
      : newQuote;
    setPolicy(item.id, quoteToSave, {
      name: checkoutName.trim(),
      personnummer: checkoutPersonnummer.trim(),
      betalningsmetod,
      hasOldPolicy: !!hasOldPolicy,
      oldBolag: hasOldPolicy ? oldBolag.trim() || undefined : undefined,
      oldAvtalsnummer: hasOldPolicy ? oldAvtalsnummer.trim() || undefined : undefined,
      wantsCancellationHelp: cancellationHelp,
      halsodeklaration: needsHalsodeklaration
        ? {
            roker: !!roker,
            sjukskrivenSenaste5Ar: !!sjukskrivenSenaste5Ar,
            pagaendeBehandling: !!pagaendeBehandling,
            tidigareAvslag: !!tidigareAvslag,
          }
        : undefined,
    });
    setWantsCancellationHelp(cancellationHelp);
    setSignedQuote(pendingQuote);
    setPhase("signed");

    // Spara-sammanfattningsmejl (Del i 21-sektionsplanen) — bara när det
    // faktiskt är en besparing mot ett tidigare auto-hämtat pris, annars
    // vore "du sparar" mejlet missvisande.
    if (current && profile?.email && profile.notifyEmail !== false && pendingQuote.price < current.price) {
      const oldPrice = current.price;
      const newPrice = pendingQuote.price;
      (async () => {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        sendTransactionalEmail(token, {
          type: "savings_summary",
          to: profile.email!,
          itemTitle: label,
          bolag: pendingQuote.name,
          oldPrice,
          newPrice,
        });
      })();
    }
  };

  const handleCheckoutSubmit = () => {
    if (hasOldPolicy) setPhase("cancellation");
    else finalizeSign();
  };

  return (
    <div className="min-h-screen w-full">
      {phase === "fork" && (
        <>
          <div className="w-full flex items-center justify-between px-6 py-5">
            <Logo />
            <div className="w-6" />
          </div>
          <div className="flex items-start justify-center px-5">
            <div className="w-full max-w-md bd-fade">
              <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
                <ArrowLeft size={15} /> Tillbaka
              </button>
              <BuddyStage emotion={emotion} size={64} className="mb-4" />
              <span className="bd-eyebrow">{label}</span>
              <h1 className="bd-display text-2xl mt-3 mb-6">Vill du jämföra bara den här saken, eller hela din lösning?</h1>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setPhase(hasNeedsStep ? "needs" : "loading")}
                  className="w-full text-left p-5 rounded-2xl border border-line bg-white"
                >
                  <div className="font-semibold text-[15px] mb-1">Bara {label.toLowerCase()}</div>
                  <div className="text-sm text-slate">Buddy jämför just den här saken mot marknaden direkt.</div>
                </button>
                <button
                  onClick={() => router.push("/book?topic=HELHET")}
                  className="w-full text-left p-5 rounded-2xl border border-line bg-white"
                >
                  <div className="font-semibold text-[15px] mb-1">Hela min lösning</div>
                  <div className="text-sm text-slate">Boka en specialist som går igenom allt du har samlat, i ett samtal.</div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {phase === "needs" && (
        <>
          <div className="w-full flex items-center justify-between px-6 py-5">
            <Logo />
            <div className="w-6" />
          </div>
          <div className="flex items-center justify-center px-5">
            <div className="w-full max-w-lg bd-fade">
              <BuddyStage emotion={emotion} size={64} className="mb-4" />
              <NeedsAnalysis
                kind={item.kind as NeedsKind}
                item={item}
                currentPolicy={policies[item.id]}
                onBack={() => router.push("/dashboard")}
                initialConfirmed={initialNeeds.length > 0 ? initialNeeds : undefined}
                onItemUpdate={updateItem}
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
          <BuddyStage
            emotion={emotion}
            size={96}
            className="flex flex-col items-center text-center"
            timeoutMessage="Det tar ovanligt lång tid just nu — prova gärna igen om en liten stund."
          />
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

          {hasThreeColumnLayout ? (
            <div className="max-w-5xl mx-auto px-5 md:px-10 pb-14 bd-fade">
              <BuddyStage emotion={emotion} size={64} className="mb-4" />
              <span className="bd-eyebrow">Din jämförelse</span>
              <h1 className="bd-display text-3xl mt-2 mb-2">Så ser dina alternativ ut</h1>
              <p className="text-sm mb-5 text-slate">
                Baserat på {label.toLowerCase()} — {itemSummary(item)}.
              </p>

              {item.kind === "el" && (
                <div className="rounded-2xl p-4 mb-5 flex items-start gap-3 bg-frost-2">
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
              <BuddyStage emotion={emotion} size={64} className="mb-4" />
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

              {item.kind === "telekom" && item.typ === "mobil" && (
                <div className="mb-5">
                  <CoverageMap operatorName={winner.name} defaultAddress={homeAddress} />
                </div>
              )}

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

      {phase === "checkout" && pendingQuote && (
        <div className="min-h-screen w-full flex flex-col">
          <div className="w-full flex items-center justify-between px-6 py-5">
            <Logo />
            <div className="w-6" />
          </div>
          <div className="flex-1 flex items-start justify-center px-5 pb-16">
            <div className="w-full max-w-md bd-fade">
              <BuddyStage emotion={emotion} size={56} className="mb-4" />
              {!profile?.fullmaktSignedAt ? (
                <FullmaktSigning name={checkoutName || undefined} onDone={() => {}} />
              ) : (
                <CheckoutForm
                  quoteName={pendingQuote.name}
                  name={checkoutName}
                  setName={setCheckoutName}
                  personnummer={checkoutPersonnummer}
                  setPersonnummer={setCheckoutPersonnummer}
                  betalningsmetod={betalningsmetod}
                  setBetalningsmetod={setBetalningsmetod}
                  hasOldPolicy={hasOldPolicy}
                  setHasOldPolicy={setHasOldPolicy}
                  oldBolag={oldBolag}
                  setOldBolag={setOldBolag}
                  oldAvtalsnummer={oldAvtalsnummer}
                  setOldAvtalsnummer={setOldAvtalsnummer}
                  needsHalsodeklaration={needsHalsodeklaration}
                  roker={roker}
                  setRoker={setRoker}
                  sjukskrivenSenaste5Ar={sjukskrivenSenaste5Ar}
                  setSjukskrivenSenaste5Ar={setSjukskrivenSenaste5Ar}
                  pagaendeBehandling={pagaendeBehandling}
                  setPagaendeBehandling={setPagaendeBehandling}
                  tidigareAvslag={tidigareAvslag}
                  setTidigareAvslag={setTidigareAvslag}
                  onSubmit={handleCheckoutSubmit}
                  onBack={() => setPhase("results")}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "cancellation" && pendingQuote && (
        <div className="min-h-screen w-full flex flex-col">
          <div className="w-full flex items-center justify-between px-6 py-5">
            <Logo />
            <div className="w-6" />
          </div>
          <div className="flex-1 flex items-center justify-center px-5 pb-16">
            <div className="w-full max-w-md bd-fade">
              <BuddyStage emotion={emotion} size={56} className="mb-4" />
              <span className="bd-eyebrow">Nästan klart</span>
              <h1 className="bd-display text-2xl mt-3 mb-2">
                Vill du att Buddy hjälper dig säga upp {oldBolag.trim() || "din nuvarande försäkring"}?
              </h1>
              <p className="text-sm mb-6 text-slate">
                Det är Buddy — inte {pendingQuote.name} — som i så fall sköter uppsägningen åt dig, med stöd av
                din fullmakt.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => finalizeSign(true)}
                  className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
                >
                  Ja, hjälp mig säga upp
                </button>
                <button
                  onClick={() => finalizeSign(false)}
                  className="w-full text-sm font-semibold py-3 text-slate"
                >
                  Nej, jag gör det själv
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "signed" && signedQuote && (
        <div className="min-h-screen w-full flex flex-col">
          <div className="w-full flex items-center justify-between px-6 py-5">
            <Logo />
            <div className="w-6" />
          </div>
          <div className="flex-1 flex items-start justify-center px-5 pt-4 pb-16">
            <div className="w-full max-w-lg bd-fade">
              <div className="flex items-center gap-3 mb-6">
                <BuddyStage emotion={emotion} size={48} />
                <div>
                  <div className="font-semibold text-[15px]">Klart — {signedQuote.name} är valt</div>
                  <div className="text-xs text-slate">{label}</div>
                </div>
              </div>
              {currentPolicy?.forfallodatum && (
                <div className="rounded-2xl p-4 mb-6 text-sm bg-frost-2 text-ink">
                  <span className="font-semibold">Framdaterad.</span> {signedQuote.name} börjar gälla{" "}
                  {currentPolicy.forfallodatum}, när din nuvarande försäkring hos {currentPolicy.name} löper ut. Fram
                  tills dess gäller ditt befintliga avtal som vanligt.
                </div>
              )}
              <div className="bg-white rounded-2xl border border-line p-6 mb-6">
                {(
                  [
                    {
                      label: "Mottaget",
                      desc: `Ditt val av ${signedQuote.name} är sparat i din översikt.`,
                      done: true,
                      current: false,
                    },
                    {
                      label: "Bolaget hör av sig",
                      desc: `${signedQuote.name} kontaktar dig inom kort för att slutföra avtalet.`,
                      done: false,
                      current: true,
                    },
                    {
                      label: "Klart",
                      desc: `Du hittar avtalet under ${label} när som helst i din översikt.`,
                      done: false,
                      current: false,
                    },
                  ] satisfies { label: string; desc: string; done: boolean; current: boolean }[]
                ).map((s, i, arr) => (
                  <div key={s.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-none ${s.current ? "bd-pulsedot" : ""}`}
                        style={{
                          background: s.done || s.current ? "var(--color-forest)" : "white",
                          border: s.done || s.current ? "none" : "2px solid var(--color-line)",
                        }}
                      >
                        {s.done ? (
                          <Check size={13} color="white" />
                        ) : s.current ? (
                          <CircleDot size={13} color="white" />
                        ) : null}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-0.5 flex-1 my-1" style={{ background: "var(--color-line)", minHeight: 34 }} />
                      )}
                    </div>
                    <div className="pb-8">
                      <div className="text-sm font-semibold mb-0.5">{s.label}</div>
                      <div className="text-xs text-slate">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {wantsCancellationHelp && (
                <div className="rounded-2xl p-4 mb-6 flex items-start gap-3 bg-frost-2">
                  <ShieldCheck size={15} className="flex-none mt-0.5 text-forest" />
                  <p className="text-xs text-ink">
                    Buddy hör av sig för att hjälpa dig säga upp din försäkring hos{" "}
                    {oldBolag.trim() || "ditt tidigare bolag"} — du behöver inte göra något själv.
                  </p>
                </div>
              )}
              <button
                onClick={() => router.push("/dashboard")}
                className="bd-btn w-full py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest mb-3"
              >
                Till översikten
              </button>
              <button
                onClick={() => router.push("/book")}
                className="w-full text-sm font-semibold text-forest text-center"
              >
                Boka ett uppföljningssamtal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
