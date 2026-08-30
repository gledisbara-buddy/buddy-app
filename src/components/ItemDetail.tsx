"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarPlus, Download, Pencil, Trash2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ConfirmDialog } from "@/components/Overlay";
import { getCancelTarget } from "@/components/Dashboard";
import { useBuddy } from "@/lib/buddy-context";
import {
  createItemId,
  groupForKind,
  isComparableItem,
  ITEM_CATEGORIES,
  itemDetailRows,
  itemSummary,
  itemTitle,
  type InsuranceItem,
} from "@/lib/items";
import { buildIcsFile } from "@/lib/booking";
import { buildItemSummaryPdf } from "@/lib/item-pdf";
import { parseSwedishDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { computeMoveStatus, effectiveQuote, MOVE_STATUS_LABELS, type Quote } from "@/lib/quote";

type HistoryRow = { data: Quote; created_at: string };
type ForeignItem = { memberName: string; item: InsuranceItem; policy: Quote | null };

function formatHistoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

// Del G i docs/kundresa-v2-steg2-plan.md: en fullständig detaljvy per post
// innan kunden väljer att jämföra — nuvarande villkor, pris, förfallodatum.
// Historiken (21-punktsplanen) läses från policy_history — en separat,
// tillskrivande logg som setPolicy() i buddy-context.tsx skriver till vid
// sidan av den vanliga policies-uppdateringen (se schema.sql). Visas bara
// om det faktiskt finns rader — en ny post har ingen historik än.
export function ItemDetail({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { items, policies, removeItem, household, setPolicy } = useBuddy();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const item = items.find((i) => i.id === itemId);
  // undefined = inte kollat än, null = kollat men hittade inget, annars
  // en hushållsmedlems sak öppnad i skrivskyddat läge (se Dashboard.tsx).
  const [foreignItem, setForeignItem] = useState<ForeignItem | null | undefined>(undefined);

  useEffect(() => {
    if (item || !household) return;
    const supabase = createClient();
    supabase
      .rpc("get_household_items")
      .then(({ data }) => {
        const rows = (data ?? []) as { member_name: string; data: InsuranceItem; policy: Quote | null }[];
        const match = rows.find((r) => r.data.id === itemId);
        setForeignItem(match ? { memberName: match.member_name, item: match.data, policy: match.policy } : null);
      });
  }, [item, household, itemId]);

  // Väntar inte in en pågående hushålls-koll (foreignItem === undefined)
  // innan den redirectar — bara när det är klart att det inte finns
  // något hushåll att kolla mot, eller att kollen redan gav nobben.
  useEffect(() => {
    if (!item && (!household || foreignItem === null)) router.replace("/dashboard");
  }, [item, household, foreignItem, router]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("policy_history")
      .select("data, created_at")
      .eq("item_id", itemId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setHistory((data ?? []) as HistoryRow[]));
  }, [itemId]);

  if (!item) {
    if (!foreignItem) return null;
    // Skrivskyddad detaljvy för en hushållsmedlems sak (öppnad via
    // Dashboard.tsx/HouseholdView.tsx) — samma "Nuvarande villkor"-rader
    // som kundens egna, men utan redigera/ta bort/jämför/skada-knappar.
    const ForeignIcon = ITEM_CATEGORIES.find((c) => c.kind === foreignItem.item.kind)!.icon;
    const foreignRows = itemDetailRows(foreignItem.item, foreignItem.policy ?? undefined);
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-between px-6 py-5">
          <Logo />
          <div className="w-6" />
        </div>
        <div className="flex-1 flex items-start justify-center px-5 pb-16">
          <div className="w-full max-w-md bd-fade">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
              <ArrowLeft size={15} /> Tillbaka
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                <ForeignIcon size={20} className="text-forest" />
              </div>
              <div>
                <h1 className="bd-display text-xl">{itemTitle(foreignItem.item)}</h1>
                <div className="text-sm text-slate">{itemSummary(foreignItem.item)}</div>
              </div>
            </div>
            <p className="text-xs mb-6 text-slate">{foreignItem.memberName}s sak — du ser detaljer, inga ändringar.</p>

            <div className="bg-white rounded-2xl border border-line mb-6 overflow-hidden">
              <div className="px-5 pt-4 pb-2 text-sm font-semibold">
                {foreignItem.policy ? "Nuvarande villkor" : `Inga villkor sparade för ${itemTitle(foreignItem.item)} ännu`}
              </div>
              {foreignRows.length > 0 ? (
                <div className="divide-y divide-line">
                  {foreignRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="text-slate">{row.label}</span>
                      <span className="font-medium text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 pb-4 text-sm text-slate">Inga sparade villkor att visa.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rawQuote = policies[item.id];
  const quote = rawQuote ? effectiveQuote(rawQuote) : undefined;
  const moveStatus =
    rawQuote?.pendingQuote && rawQuote.forfallodatum ? computeMoveStatus(rawQuote.forfallodatum) : undefined;
  const Icon = ITEM_CATEGORIES.find((c) => c.kind === item.kind)!.icon;
  const forfallodatum = quote?.forfallodatum ?? ("forfallodatum" in item ? item.forfallodatum : undefined);

  const detailRows = itemDetailRows(item, quote);
  const cancelTarget = getCancelTarget(item, rawQuote);
  const canClaim = groupForKind(item.kind) === "forsakring";

  const addRenewalToCalendar = () => {
    if (!forfallodatum) return;
    const date = parseSwedishDate(forfallodatum);
    if (!date) return;
    date.setHours(9, 0, 0, 0);
    const ics = buildIcsFile({
      start: date,
      durationMinutes: 30,
      title: `${itemTitle(item)} förnyas`,
      description: `Din ${itemTitle(item).toLowerCase()} hos Buddy förnyas ${forfallodatum} — bra tillfälle att jämföra priset igen.`,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buddy-fornyelse.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSummaryPdf = async () => {
    setDownloadingPdf(true);
    const pdfBytes = await buildItemSummaryPdf({ item, quote, generatedAt: new Date() });
    setDownloadingPdf(false);
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buddy-${itemTitle(item).toLowerCase().replace(/\s+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      {confirmDelete && (
        <ConfirmDialog
          title="Ta bort den här saken?"
          body="Den försvinner från din översikt och tas bort permanent."
          confirmLabel="Ta bort"
          onConfirm={() => {
            removeItem(item.id);
            router.push("/dashboard");
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {confirmCancel && cancelTarget && (
        <ConfirmDialog
          title="Säg upp den här saken?"
          body="Buddy tar kontakt med bolaget och sköter uppsägningen åt dig. Du ser status under Att göra tills den är klar."
          confirmLabel="Säg upp åt mig"
          onConfirm={() => {
            const now = new Date().toISOString();
            if (rawQuote) {
              setPolicy(item.id, { ...rawQuote, cancellationPending: true, cancellationRequestedAt: now });
            } else {
              setPolicy(item.id, {
                id: createItemId(),
                name: cancelTarget.name,
                price: cancelTarget.price ?? 0,
                highlights: [],
                cancellationPending: true,
                cancellationRequestedAt: now,
              });
            }
            setConfirmCancel(false);
          }}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
      <div className="w-full flex items-center justify-between px-6 py-5">
        <Logo />
        <div className="w-6" />
      </div>
      <div className="flex-1 flex items-start justify-center px-5 pb-16">
        <div className="w-full max-w-md bd-fade">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-5 opacity-60 hover:opacity-100">
            <ArrowLeft size={15} /> Tillbaka
          </button>

          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                <Icon size={20} className="text-forest" />
              </div>
              <div>
                <h1 className="bd-display text-xl">{itemTitle(item)}</h1>
                <div className="text-sm text-slate">{itemSummary(item)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-none">
              <button
                onClick={() => router.push(`/onboarding?itemId=${item.id}`)}
                className="opacity-40 hover:opacity-100"
                aria-label="Redigera"
              >
                <Pencil size={16} />
              </button>
              <button onClick={() => setConfirmDelete(true)} className="opacity-40 hover:opacity-100" aria-label="Ta bort">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {moveStatus && moveStatus !== "flytt-genomford" && (
            <div className="rounded-2xl p-4 mb-6 text-sm bg-frost-2 text-ink">
              <span className="font-semibold">{MOVE_STATUS_LABELS[moveStatus]}.</span>{" "}
              {rawQuote!.pendingQuote!.name} tar över {rawQuote!.forfallodatum} — fram tills dess gäller villkoren
              nedan som vanligt.
            </div>
          )}

          <div className="bg-white rounded-2xl border border-line mb-6 overflow-hidden">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold">
              {quote ? "Nuvarande villkor" : `Inga villkor sparade för ${itemTitle(item)} ännu`}
            </div>
            {detailRows.length > 0 ? (
              <div className="divide-y divide-line">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-slate">{row.label}</span>
                    <span className="font-medium text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 pb-4 text-sm text-slate">
                Lägg till uppgifter genom att jämföra, så sparas villkoren här.
              </div>
            )}
          </div>

          {history.length > 1 && (
            <div className="bg-white rounded-2xl border border-line mb-6 overflow-hidden">
              <div className="px-5 pt-4 pb-2 text-sm font-semibold">Historik</div>
              <div className="divide-y divide-line">
                {history.map((row, i) => (
                  <div key={`${row.created_at}-${i}`} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-slate">{formatHistoryDate(row.created_at)}</span>
                    <span className="font-medium text-right">
                      {row.data.name} · {row.data.price} kr/mån
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rawQuote?.cancellationPending && (
            <div className="text-xs font-semibold mb-3 text-amber-deep">Uppsägning pågår hos Buddy</div>
          )}

          {isComparableItem(item) && (
            <button
              onClick={() => router.push(`/compare/${item.id}`)}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
            >
              Jämför <ArrowRight size={16} />
            </button>
          )}

          {(cancelTarget || canClaim) && !rawQuote?.cancellationPending && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 justify-center">
              {cancelTarget && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="text-sm font-medium text-slate hover:text-ink"
                >
                  Säg upp
                </button>
              )}
              {canClaim && (
                <button
                  onClick={() => router.push(`/claim?item=${encodeURIComponent(itemTitle(item))}`)}
                  className="text-sm font-medium text-slate hover:text-ink"
                >
                  Hjälp med skada
                </button>
              )}
            </div>
          )}

          {forfallodatum && (
            <button
              onClick={addRenewalToCalendar}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-3 rounded-full border border-line text-sm font-medium"
            >
              <CalendarPlus size={15} /> Påminn mig i kalendern
            </button>
          )}

          <button
            onClick={downloadSummaryPdf}
            disabled={downloadingPdf}
            className="w-full flex items-center justify-center gap-2 py-2.5 mt-3 rounded-full border border-line text-sm font-medium disabled:opacity-50"
          >
            <Download size={15} /> {downloadingPdf ? "Skapar PDF…" : "Ladda ner sammanfattning (PDF)"}
          </button>
        </div>
      </div>
    </div>
  );
}
