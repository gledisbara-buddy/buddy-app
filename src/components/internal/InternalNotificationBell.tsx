"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, AtSign, Bell, Calendar, CalendarClock, ClipboardSignature, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Item = {
  key: string;
  icon: "case" | "escalated" | "document" | "mention" | "deadline";
  text: string;
  timestamp: string;
  isNew: boolean;
  onClick: () => void;
};

const ICONS = { case: ShieldAlert, escalated: AlertTriangle, document: ClipboardSignature, mention: AtSign, deadline: CalendarClock };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}
const todayIso = () => new Date().toISOString().slice(0, 10);

// Notisklocka för internverktyget — beräknas varje gång den öppnas, inte
// en riktig push (ingen sådan infrastruktur finns i appen, se
// EmployeeDashboard.tsx:s "Kommande deadlines" för samma princip). Räknat
// "nytt" mäts mot employees.notifications_checked_at, som flyttas fram
// till nu när klockan öppnas. Deadlines är ett undantag — de visas alltid
// när de är nära (inte en diskret händelse) men räknas INTE i
// olästa-badgen, bara de fyra händelsebaserade kategorierna gör det.
//
// Byggdes INTE: Avbokning (bookings saknar en updated_at-kolumn, går inte
// att avgöra NÄR en avbokning skedde), Nya kundmeddelanden/Viktiga
// systemmeddelanden (inget meddelande-/aviseringssystem finns),
// Anpassningsbara notisinställningar (vilka kategorier man vill se) —
// alla värda att bygga separat om det behövs.
export function InternalNotificationBell({ myEmail, onOpenCustomer }: { myEmail: string; onOpenCustomer: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [deadlineItems, setDeadlineItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const onOpenCustomerRef = useRef(onOpenCustomer);
  useEffect(() => {
    onOpenCustomerRef.current = onOpenCustomer;
  }, [onOpenCustomer]);

  // markAsRead sker inuti samma anrop som hämtningen (inte som ett
  // separat steg mot komponentens items-state) — annars kan en
  // föråldrad closure av items användas när klockan öppnas direkt efter
  // en refetch.
  const loadNotifications = useCallback(
    async (markAsRead: boolean) => {
      const supabase = createClient();
      setLoading(true);
      const { data: myRow } = await supabase
        .from("employees")
        .select("name, notifications_checked_at")
        .eq("email", myEmail)
        .single();
      const row = myRow as { name: string | null; notifications_checked_at: string } | null;
      const checkedAt = row?.notifications_checked_at ?? new Date(0).toISOString();
      const myTokens = [myEmail.toLowerCase(), (row?.name ?? "").toLowerCase().replace(/\s+/g, "")].filter(Boolean);

      const [{ data: bookingRows }, { data: claimRows }, { data: fullmaktRows }, { data: caseComments }, { data: notes }] =
        await Promise.all([
          supabase.from("bookings").select("id, user_id, status, created_at, deadline, escalated_at"),
          supabase.from("claims").select("id, user_id, status, created_at, deadline, escalated_at, skadetyp"),
          supabase.from("fullmakt_history").select("id, user_id, signed_at").gte("signed_at", checkedAt),
          supabase.from("case_comments").select("id, case_type, case_id, comment, created_at").gte("created_at", checkedAt),
          supabase.from("customer_notes").select("id, user_id, body, created_at").gte("created_at", checkedAt),
        ]);

      type CaseRow = {
        id: string;
        user_id: string;
        status: string;
        created_at: string;
        deadline: string | null;
        escalated_at: string | null;
        skadetyp?: string | null;
      };
      const bRows = (bookingRows ?? []) as CaseRow[];
      const cRows = (claimRows ?? []) as CaseRow[];
      const caseUserById = new Map<string, string>();
      [...bRows, ...cRows].forEach((r) => caseUserById.set(r.id, r.user_id));

      const fresh: Item[] = [
        ...bRows
          .filter((b) => b.status === "ny" && b.created_at >= checkedAt)
          .map((b) => ({
            key: `case-b-${b.id}`,
            icon: "case" as const,
            text: "Ny bokning: Boka specialist",
            timestamp: b.created_at,
            isNew: true,
            onClick: () => onOpenCustomerRef.current(b.user_id),
          })),
        ...cRows
          .filter((c) => c.status === "mottagen" && c.created_at >= checkedAt)
          .map((c) => ({
            key: `case-c-${c.id}`,
            icon: "case" as const,
            text: `Nytt ärende: Skadeanmälan${c.skadetyp ? ` — ${c.skadetyp}` : ""}`,
            timestamp: c.created_at,
            isNew: true,
            onClick: () => onOpenCustomerRef.current(c.user_id),
          })),
      ];

      const escalated: Item[] = [...bRows, ...cRows]
        .filter((r) => r.escalated_at && r.escalated_at >= checkedAt)
        .map((r) => ({
          key: `esc-${r.id}`,
          icon: "escalated" as const,
          text: "Ett ärende har blivit eskalerat",
          timestamp: r.escalated_at as string,
          isNew: true,
          onClick: () => onOpenCustomerRef.current(r.user_id),
        }));

      const documents: Item[] = ((fullmaktRows ?? []) as { id: string; user_id: string; signed_at: string }[]).map((f) => ({
        key: `doc-${f.id}`,
        icon: "document" as const,
        text: "Ny fullmakt signerad",
        timestamp: f.signed_at,
        isNew: true,
        onClick: () => onOpenCustomerRef.current(f.user_id),
      }));

      const mentionOf = (text: string) => myTokens.some((t) => t.length > 1 && text.toLowerCase().includes(`@${t}`));
      const mentions: Item[] = [
        ...((caseComments ?? []) as { id: string; case_type: string; case_id: string; comment: string; created_at: string }[])
          .filter((c) => mentionOf(c.comment))
          .map((c) => ({
            key: `mention-case-${c.id}`,
            icon: "mention" as const,
            text: `Omnämnd i en kommentar: "${c.comment}"`,
            timestamp: c.created_at,
            isNew: true,
            onClick: () => {
              const uid = caseUserById.get(c.case_id);
              if (uid) onOpenCustomerRef.current(uid);
            },
          })),
        ...((notes ?? []) as { id: string; user_id: string; body: string; created_at: string }[])
          .filter((n) => mentionOf(n.body))
          .map((n) => ({
            key: `mention-note-${n.id}`,
            icon: "mention" as const,
            text: `Omnämnd i en anteckning: "${n.body}"`,
            timestamp: n.created_at,
            isNew: true,
            onClick: () => onOpenCustomerRef.current(n.user_id),
          })),
      ];

      const freshItems = [...fresh, ...escalated, ...documents, ...mentions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setItems(freshItems);

      const today = todayIso();
      const in3Days = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
      setDeadlineItems(
        [...bRows, ...cRows]
          .filter((r) => r.deadline && r.deadline <= in3Days && (r.status === "ny" || r.status === "mottagen" || r.status === "under_utredning"))
          .map((r) => ({
            key: `deadline-${r.id}`,
            icon: "deadline" as const,
            text: r.deadline! < today ? "Deadline passerad" : "Deadline närmar sig",
            timestamp: r.deadline as string,
            isNew: false,
            onClick: () => onOpenCustomerRef.current(r.user_id),
          }))
      );

      setLoading(false);

      if (markAsRead && freshItems.length > 0) {
        supabase.from("employees").update({ notifications_checked_at: new Date().toISOString() }).eq("email", myEmail).then(() => {});
        setItems((prev) => prev.map((i) => ({ ...i, isNew: false })));
      }
    },
    [myEmail]
  );

  useEffect(() => {
    (async () => {
      await loadNotifications(false);
    })();
  }, [loadNotifications]);

  const unreadCount = items.filter((i) => i.isNew).length;

  return (
    <div className="relative">
      <button
        onClick={() => {
          const opening = !open;
          setOpen(opening);
          if (opening) loadNotifications(true);
        }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center border border-line bg-white"
        aria-label="Notiser"
      >
        <Bell size={16} className="text-ink" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-semibold text-white bg-red-600">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-h-96 overflow-y-auto bd-scroll bg-white rounded-2xl border border-line shadow-lg p-2">
            {loading ? (
              <p className="text-sm text-slate p-3">Laddar…</p>
            ) : items.length === 0 && deadlineItems.length === 0 ? (
              <p className="text-sm text-slate p-3">Inga notiser just nu.</p>
            ) : (
              <>
                {items.map((item) => {
                  const Icon = ICONS[item.icon];
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        item.onClick();
                        setOpen(false);
                      }}
                      className="w-full flex items-start gap-2.5 text-left p-2.5 rounded-xl hover:bg-frost"
                    >
                      <Icon size={15} className="text-forest flex-none mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{item.text}</div>
                        <div className="text-xs text-slate">{formatDateTime(item.timestamp)}</div>
                      </div>
                    </button>
                  );
                })}
                {deadlineItems.length > 0 && (
                  <>
                    {items.length > 0 && <div className="h-px my-1 bg-line" />}
                    <div className="text-xs px-2.5 pt-1 pb-1.5 text-slate uppercase tracking-wide">Deadlines som närmar sig</div>
                    {deadlineItems.map((item) => {
                      const Icon = ICONS[item.icon];
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            item.onClick();
                            setOpen(false);
                          }}
                          className="w-full flex items-start gap-2.5 text-left p-2.5 rounded-xl hover:bg-frost"
                        >
                          <Icon size={15} className="text-amber-deep flex-none mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{item.text}</div>
                            <div className="text-xs text-slate">
                              <Calendar size={11} className="inline mr-1 mb-0.5" />
                              {item.timestamp}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
