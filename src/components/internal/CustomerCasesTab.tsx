"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/claim";

type BookingRow = {
  id: string;
  topics: string[];
  extra_note: string | null;
  meeting_type: "video" | "phone";
  day: string;
  time: string;
  contact: string;
  status: "ny" | "hanterad";
  created_at: string;
};

type ClaimRow = {
  id: string;
  transcript: ChatMessage[];
  photo_count: number;
  receipt_count: number;
  skadetyp: string | null;
  allvarlighetsgrad: string | null;
  status: "ny" | "hanterad";
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

// Samma bokningar/skadeanmälningar som Förfrågningar-fliken, men skopat
// till en enda kund istället för hela inkorgen.
export function CustomerCasesTab({ customerId }: { customerId: string }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const [{ data: bookingRows }, { data: claimRows }] = await Promise.all([
        supabase.from("bookings").select("*").eq("user_id", customerId).order("created_at", { ascending: false }),
        supabase.from("claims").select("*").eq("user_id", customerId).order("created_at", { ascending: false }),
      ]);
      setBookings((bookingRows ?? []) as BookingRow[]);
      setClaims((claimRows ?? []) as ClaimRow[]);
      setLoading(false);
    })();
  }, [customerId]);

  const toggleBookingStatus = async (row: BookingRow) => {
    const nextStatus = row.status === "ny" ? "hanterad" : "ny";
    const supabase = createClient();
    await supabase.from("bookings").update({ status: nextStatus }).eq("id", row.id);
    setBookings((prev) => prev.map((b) => (b.id === row.id ? { ...b, status: nextStatus } : b)));
  };

  const toggleClaimStatus = async (row: ClaimRow) => {
    const nextStatus = row.status === "ny" ? "hanterad" : "ny";
    const supabase = createClient();
    await supabase.from("claims").update({ status: nextStatus }).eq("id", row.id);
    setClaims((prev) => prev.map((c) => (c.id === row.id ? { ...c, status: nextStatus } : c)));
  };

  const requests = [
    ...bookings.map((row) => ({ kind: "booking" as const, row })),
    ...claims.map((row) => ({ kind: "claim" as const, row })),
  ].sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (requests.length === 0) return <p className="text-sm text-slate">Inga ärenden än.</p>;

  return (
    <div className="flex flex-col gap-3">
      {requests.map(({ kind, row }) => (
        <div key={`${kind}-${row.id}`} className="bg-white rounded-2xl border border-line p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                {kind === "booking" ? <Calendar size={14} className="text-forest" /> : <ShieldAlert size={14} className="text-forest" />}
              </div>
              <div>
                <div className="text-sm font-semibold">{kind === "booking" ? "Boka specialist" : "Skadeanmälan"}</div>
                <div className="text-xs text-slate">{formatDate(row.created_at)}</div>
              </div>
            </div>
            <span className={`text-xs font-semibold flex-none ${row.status === "ny" ? "text-amber-deep" : "text-forest"}`}>
              {row.status === "ny" ? "● Ny" : "● Hanterad"}
            </span>
          </div>

          {kind === "booking" ? (
            <div className="text-sm text-ink mb-2">
              <div>
                {row.meeting_type === "video" ? "Videosamtal" : "Telefonsamtal"} — {formatDate(row.day)} kl. {row.time}
              </div>
              <div className="text-slate">Kontakt: {row.contact}</div>
              {row.extra_note && <div className="text-slate">{`"${row.extra_note}"`}</div>}
            </div>
          ) : (
            <div className="text-sm text-ink mb-2">
              <div>
                {row.skadetyp ?? "Okänd skadetyp"} · {row.allvarlighetsgrad ?? "–"}
              </div>
              <div className="text-slate">
                {row.photo_count} foto, {row.receipt_count} kvitton
              </div>
            </div>
          )}

          <button
            onClick={() => (kind === "booking" ? toggleBookingStatus(row) : toggleClaimStatus(row))}
            className="text-xs font-semibold flex items-center gap-1 text-forest"
          >
            <Check size={12} /> Markera som {row.status === "ny" ? "hanterad" : "ny"}
          </button>
        </div>
      ))}
    </div>
  );
}
