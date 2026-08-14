"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarPlus, Trash2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ConfirmDialog } from "@/components/Overlay";
import { useBuddy } from "@/lib/buddy-context";
import { isComparableItem, ITEM_CATEGORIES, itemSummary, itemTitle } from "@/lib/items";
import { buildIcsFile } from "@/lib/booking";
import { parseSwedishDate } from "@/lib/dates";

// Del G i docs/kundresa-v2-steg2-plan.md: en fullständig detaljvy per post
// innan kunden väljer att jämföra — nuvarande villkor, pris, förfallodatum.
// Historik byggs inte här (ingen historik-datamodell finns än, se den
// bredare 21-sektionsplanen); avsnittet visas bara om det finns något att
// visa, och just nu finns det aldrig.
export function ItemDetail({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { items, policies, removeItem } = useBuddy();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const item = items.find((i) => i.id === itemId);

  useEffect(() => {
    if (!item) router.replace("/dashboard");
  }, [item, router]);

  if (!item) return null;

  const quote = policies[item.id];
  const Icon = ITEM_CATEGORIES.find((c) => c.kind === item.kind)!.icon;
  const forfallodatum = quote?.forfallodatum ?? ("forfallodatum" in item ? item.forfallodatum : undefined);

  const detailRows: { label: string; value: string }[] = quote
    ? [
        { label: "Bolag", value: quote.name },
        { label: "Pris", value: `${quote.price} kr/mån` },
        ...(quote.omfattning ? [{ label: "Omfattning", value: quote.omfattning }] : []),
        ...(quote.selfRisk != null ? [{ label: "Självrisk", value: `${quote.selfRisk.toLocaleString("sv-SE")} kr` }] : []),
        ...(quote.karenstid ? [{ label: "Karenstid", value: quote.karenstid }] : []),
        ...(quote.ersattningstak ? [{ label: "Ersättningstak", value: quote.ersattningstak }] : []),
        ...(quote.bindningstid ? [{ label: "Bindningstid", value: quote.bindningstid }] : []),
        ...(quote.uppsagningstid ? [{ label: "Uppsägningstid", value: quote.uppsagningstid }] : []),
        ...(forfallodatum ? [{ label: "Förfaller", value: forfallodatum }] : []),
      ]
    : forfallodatum
      ? [{ label: "Förfaller", value: forfallodatum }]
      : [];

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
            <button onClick={() => setConfirmDelete(true)} className="opacity-40 hover:opacity-100 mt-1">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-line mb-6 overflow-hidden">
            <div className="px-5 pt-4 pb-2 text-sm font-semibold">
              {quote ? "Nuvarande villkor" : "Inga villkor sparade ännu"}
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

          {isComparableItem(item) && (
            <button
              onClick={() => router.push(`/compare/${item.id}`)}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
            >
              Jämför <ArrowRight size={16} />
            </button>
          )}

          {forfallodatum && (
            <button
              onClick={addRenewalToCalendar}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-3 rounded-full border border-line text-sm font-medium"
            >
              <CalendarPlus size={15} /> Påminn mig i kalendern
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
