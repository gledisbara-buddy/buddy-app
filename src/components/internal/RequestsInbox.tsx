"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, ShieldAlert, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CaseAssignment } from "@/components/internal/CaseAssignment";
import { itemTitle, type InsuranceItem } from "@/lib/items";
import { CLAIM_STATUS_LABELS, claimStatusColor, type ChatMessage, type ClaimStatus } from "@/lib/claim";

type BookingRow = {
  id: string;
  user_id: string;
  topics: string[];
  extra_note: string | null;
  meeting_type: "video" | "phone";
  day: string;
  time: string;
  contact: string;
  status: "ny" | "hanterad" | "avbokad";
  created_at: string;
  assigned_to: string | null;
};

type ClaimRow = {
  id: string;
  user_id: string;
  transcript: ChatMessage[];
  photo_count: number;
  receipt_count: number;
  skadetyp: string | null;
  allvarlighetsgrad: string | null;
  status: ClaimStatus;
  created_at: string;
  assigned_to: string | null;
};

type ProfileLookup = { id: string; email: string | null; name: string };

const FIXED_TOPIC_LABELS: Record<string, string> = { OVRIGT: "Övrigt", HELHET: "Total helhetslösning" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

// Global inkorg för alla nya förfrågningar (bokningar + skadeanmälningar),
// oavsett kund — inte skopad till en öppen kund, se CustomerCasesTab.tsx
// för den kund-specifika motsvarigheten i den nya arbetsytan.
export function RequestsInbox({ actorEmail }: { actorEmail: string }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLookup>>({});
  const [itemTitlesById, setItemTitlesById] = useState<Record<string, string>>({});
  const [claimPerkByUserId, setClaimPerkByUserId] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const [{ data: bookingRows }, { data: claimRows }] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("claims").select("*").order("created_at", { ascending: false }),
      ]);
      const bRows = (bookingRows ?? []) as BookingRow[];
      const cRows = (claimRows ?? []) as ClaimRow[];
      setBookings(bRows);
      setClaims(cRows);

      const userIds = Array.from(new Set([...bRows.map((r) => r.user_id), ...cRows.map((r) => r.user_id)]));
      const itemTopicIds = Array.from(new Set(bRows.flatMap((r) => r.topics).filter((t) => !FIXED_TOPIC_LABELS[t])));

      const [{ data: profileRows }, { data: topicItemRows }] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles").select("id, email, name").in("id", userIds)
          : Promise.resolve({ data: [] as ProfileLookup[] }),
        itemTopicIds.length > 0
          ? supabase.from("items").select("id, data").in("id", itemTopicIds)
          : Promise.resolve({ data: [] as { id: string; data: InsuranceItem }[] }),
      ]);

      setProfilesById(Object.fromEntries(((profileRows ?? []) as ProfileLookup[]).map((p) => [p.id, p])));
      setItemTitlesById(
        Object.fromEntries(
          ((topicItemRows ?? []) as { id: string; data: InsuranceItem }[]).map((r) => [r.id, itemTitle(r.data)])
        )
      );

      const claimUserIds = Array.from(new Set(cRows.map((r) => r.user_id)));
      const perkResults = await Promise.all(
        claimUserIds.map((uid) => supabase.rpc("count_qualified_referrals", { referrer: uid }))
      );
      setClaimPerkByUserId(
        Object.fromEntries(claimUserIds.map((uid, i) => [uid, ((perkResults[i].data as number | null) ?? 0) >= 5]))
      );

      setLoading(false);
    })();
  }, []);

  const topicLabel = (id: string) => FIXED_TOPIC_LABELS[id] ?? itemTitlesById[id] ?? id;

  const toggleBookingStatus = async (row: BookingRow) => {
    const nextStatus = row.status === "ny" ? "hanterad" : "ny";
    const supabase = createClient();
    await supabase.from("bookings").update({ status: nextStatus }).eq("id", row.id);
    setBookings((prev) => prev.map((b) => (b.id === row.id ? { ...b, status: nextStatus } : b)));
  };

  // Snabb-triage här flyttar bara mellan "mottagen" (obehandlad) och
  // "under_utredning" (uppmärksammad) — hela statusspåret (godkänd/nekad/
  // utbetald) sätts i den kund-specifika vyn, se CustomerCasesTab.tsx.
  const toggleClaimStatus = async (row: ClaimRow) => {
    const nextStatus: ClaimStatus = row.status === "mottagen" ? "under_utredning" : "mottagen";
    const supabase = createClient();
    await supabase.from("claims").update({ status: nextStatus }).eq("id", row.id);
    setClaims((prev) => prev.map((c) => (c.id === row.id ? { ...c, status: nextStatus } : c)));
  };

  const assignBooking = async (id: string, email: string | null) => {
    const supabase = createClient();
    await supabase.from("bookings").update({ assigned_to: email }).eq("id", id);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, assigned_to: email } : b)));
  };

  const assignClaim = async (id: string, email: string | null) => {
    const supabase = createClient();
    await supabase.from("claims").update({ assigned_to: email }).eq("id", id);
    setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, assigned_to: email } : c)));
  };

  const requests = [
    ...bookings.map((row) => ({ kind: "booking" as const, row })),
    ...claims.map((row) => ({ kind: "claim" as const, row })),
  ].sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (requests.length === 0) return <p className="text-sm text-slate">Inga förfrågningar än.</p>;

  return (
    <div className="flex flex-col gap-3">
      {requests.map(({ kind, row }) => {
        const requester = profilesById[row.user_id];
        return (
          <div key={`${kind}-${row.id}`} className="bg-white rounded-2xl border border-line p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                  {kind === "booking" ? (
                    <Calendar size={16} className="text-forest" />
                  ) : (
                    <ShieldAlert size={16} className="text-forest" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold">{kind === "booking" ? "Boka specialist" : "Skadeanmälan"}</div>
                  <div className="text-xs text-slate">
                    {requester?.name || requester?.email || row.user_id} · {formatDate(row.created_at)}
                  </div>
                </div>
              </div>
              {kind === "booking" ? (
                <span
                  className={`text-xs font-semibold flex-none ${
                    row.status === "ny" ? "text-amber-deep" : row.status === "avbokad" ? "text-slate" : "text-forest"
                  }`}
                >
                  {row.status === "ny" ? "● Ny" : row.status === "avbokad" ? "● Avbokad" : "● Hanterad"}
                </span>
              ) : (
                <span className={`text-xs font-semibold flex-none ${claimStatusColor(row.status)}`}>
                  ● {CLAIM_STATUS_LABELS[row.status]}
                </span>
              )}
            </div>

            {kind === "booking" ? (
              <div className="text-sm text-ink mb-3">
                <div>
                  {row.meeting_type === "video" ? "Videosamtal" : "Telefonsamtal"} — {formatDate(row.day)} kl. {row.time}
                </div>
                <div className="text-slate">Kontakt: {row.contact}</div>
                {row.topics.length > 0 && <div className="text-slate">Gäller: {row.topics.map(topicLabel).join(", ")}</div>}
                {row.extra_note && <div className="text-slate">{`"${row.extra_note}"`}</div>}
              </div>
            ) : (
              <div className="text-sm text-ink mb-3">
                {claimPerkByUserId[row.user_id] && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 text-forest">
                    <ShieldCheck size={13} /> Kund har rätt till kostnadsfri hjälp (5+ värvningar)
                  </div>
                )}
                <div>
                  {row.skadetyp ?? "Okänd skadetyp"} · {row.allvarlighetsgrad ?? "–"}
                </div>
                <div className="text-slate">
                  {row.photo_count} foto, {row.receipt_count} kvitton
                </div>
                <div className="text-slate">
                  {row.transcript
                    .filter((m) => m.role === "user")
                    .map((m) => m.content)
                    .join(" ")}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {row.status !== "avbokad" && (
                <button
                  onClick={() => (kind === "booking" ? toggleBookingStatus(row) : toggleClaimStatus(row))}
                  className="text-sm font-semibold flex items-center gap-1 text-forest"
                >
                  <Check size={14} />{" "}
                  {kind === "booking"
                    ? `Markera som ${row.status === "ny" ? "hanterad" : "ny"}`
                    : `Markera som ${row.status === "mottagen" ? "under utredning" : "mottagen"}`}
                </button>
              )}
              <div className="ml-auto">
                <CaseAssignment
                  assignedTo={row.assigned_to}
                  myEmail={actorEmail}
                  onAssign={(email) => (kind === "booking" ? assignBooking(row.id, email) : assignClaim(row.id, email))}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
