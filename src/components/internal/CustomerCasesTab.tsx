"use client";

import { useEffect, useState } from "react";
import { Ban, Calendar, Check, ChevronDown, ChevronUp, ShieldAlert, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/Overlay";
import { EditableField } from "@/components/internal/EditableField";
import { saveField } from "@/lib/activity-log";
import { sendTransactionalEmail } from "@/lib/email";
import type { ChatMessage } from "@/lib/claim";

type BookingRow = {
  id: string;
  topics: string[];
  extra_note: string | null;
  meeting_type: "video" | "phone";
  day: string;
  time: string;
  contact: string;
  status: "ny" | "hanterad" | "avbokad";
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

function statusLabel(status: BookingRow["status"] | ClaimRow["status"]): string {
  if (status === "ny") return "● Ny";
  if (status === "avbokad") return "● Avbokad";
  return "● Hanterad";
}

function statusColor(status: BookingRow["status"] | ClaimRow["status"]): string {
  if (status === "ny") return "text-amber-deep";
  if (status === "avbokad") return "text-slate";
  return "text-forest";
}

// Samma bokningar/skadeanmälningar som Förfrågningar-fliken, men skopat
// till en enda kund och med en full detaljvy — här går fälten faktiskt
// att rätta, inte bara statusen växla. "Avboka" (bara bokningar) skiljer
// sig från radering: mötet blir inte av, men historiken finns kvar i
// motsats till en permanent raderad felaktig post.
export function CustomerCasesTab({
  customerId,
  actorEmail,
  customerEmail,
}: {
  customerId: string;
  actorEmail: string;
  customerEmail: string | null;
}) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "booking" | "claim"; id: string } | null>(null);

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

  const setBookingStatus = async (row: BookingRow, status: BookingRow["status"]) => {
    const supabase = createClient();
    const ok = await saveField(supabase, {
      table: "bookings",
      idColumn: "id",
      id: row.id,
      targetUserId: customerId,
      actorEmail,
      field: "status",
      oldValue: row.status,
      newValue: status,
    });
    if (ok) setBookings((prev) => prev.map((b) => (b.id === row.id ? { ...b, status } : b)));
  };

  const setClaimStatus = async (row: ClaimRow, status: ClaimRow["status"]) => {
    const supabase = createClient();
    const ok = await saveField(supabase, {
      table: "claims",
      idColumn: "id",
      id: row.id,
      targetUserId: customerId,
      actorEmail,
      field: "status",
      oldValue: row.status,
      newValue: status,
    });
    if (ok) setClaims((prev) => prev.map((c) => (c.id === row.id ? { ...c, status } : c)));
    if (ok && customerEmail) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) sendTransactionalEmail(token, { type: "claim_status_changed", to: customerEmail, status });
    }
  };

  const saveBookingField = async (row: BookingRow, field: keyof BookingRow, value: string) => {
    const supabase = createClient();
    const ok = await saveField(supabase, {
      table: "bookings",
      idColumn: "id",
      id: row.id,
      targetUserId: customerId,
      actorEmail,
      field,
      oldValue: row[field],
      newValue: value,
    });
    if (ok) setBookings((prev) => prev.map((b) => (b.id === row.id ? { ...b, [field]: value } : b)));
    return ok;
  };

  const saveClaimField = async (row: ClaimRow, field: keyof ClaimRow, value: string) => {
    const supabase = createClient();
    const ok = await saveField(supabase, {
      table: "claims",
      idColumn: "id",
      id: row.id,
      targetUserId: customerId,
      actorEmail,
      field,
      oldValue: row[field],
      newValue: value,
    });
    if (ok) setClaims((prev) => prev.map((c) => (c.id === row.id ? { ...c, [field]: value } : c)));
    return ok;
  };

  const runDelete = async () => {
    if (!confirmDelete) return;
    const supabase = createClient();
    const description =
      confirmDelete.kind === "booking"
        ? (() => {
            const row = bookings.find((b) => b.id === confirmDelete.id);
            return row ? `Boka specialist — ${formatDate(row.day)} kl. ${row.time}` : "Bokning";
          })()
        : (() => {
            const row = claims.find((c) => c.id === confirmDelete.id);
            return row ? `Skadeanmälan — ${row.skadetyp ?? "okänd skadetyp"}` : "Skadeanmälan";
          })();
    if (confirmDelete.kind === "booking") {
      await supabase.from("bookings").delete().eq("id", confirmDelete.id);
      setBookings((prev) => prev.filter((b) => b.id !== confirmDelete.id));
    } else {
      await supabase.from("claims").delete().eq("id", confirmDelete.id);
      setClaims((prev) => prev.filter((c) => c.id !== confirmDelete.id));
    }
    await supabase.from("activity_log").insert({
      target_user_id: customerId,
      actor_email: actorEmail,
      table_name: confirmDelete.kind === "booking" ? "bookings" : "claims",
      field: "borttagen",
      old_value: description,
      new_value: null,
    });
    setConfirmDelete(null);
    setExpandedKey(null);
  };

  const requests = [
    ...bookings.map((row) => ({ kind: "booking" as const, row })),
    ...claims.map((row) => ({ kind: "claim" as const, row })),
  ].sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;
  if (requests.length === 0) return <p className="text-sm text-slate">Inga ärenden än.</p>;

  return (
    <div className="flex flex-col gap-3">
      {requests.map(({ kind, row }) => {
        const key = `${kind}-${row.id}`;
        const expanded = expandedKey === key;
        return (
          <div key={key} className="bg-white rounded-2xl border border-line p-4">
            <button onClick={() => setExpandedKey(expanded ? null : key)} className="w-full flex items-start justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                  {kind === "booking" ? <Calendar size={14} className="text-forest" /> : <ShieldAlert size={14} className="text-forest" />}
                </div>
                <div>
                  <div className="text-sm font-semibold">{kind === "booking" ? "Boka specialist" : "Skadeanmälan"}</div>
                  <div className="text-xs text-slate">{formatDate(row.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-none">
                <span className={`text-xs font-semibold ${statusColor(row.status)}`}>{statusLabel(row.status)}</span>
                {expanded ? <ChevronUp size={15} className="text-slate" /> : <ChevronDown size={15} className="text-slate" />}
              </div>
            </button>

            {!expanded ? (
              kind === "booking" ? (
                <div className="text-sm text-ink mt-2">
                  {row.meeting_type === "video" ? "Videosamtal" : "Telefonsamtal"} — {formatDate(row.day)} kl. {row.time}
                </div>
              ) : (
                <div className="text-sm text-ink mt-2">
                  {row.skadetyp ?? "Okänd skadetyp"} · {row.allvarlighetsgrad ?? "–"}
                </div>
              )
            ) : kind === "booking" ? (
              <div className="mt-4 pt-4 border-t border-line flex flex-col gap-4">
                <div>
                  <div className="text-xs mb-1.5 text-slate uppercase tracking-wide">Mötestyp</div>
                  <div className="flex gap-2">
                    {(["video", "phone"] as const).map((mt) => (
                      <button
                        key={mt}
                        onClick={() => saveBookingField(row, "meeting_type", mt)}
                        className="px-3.5 py-1.5 rounded-full border text-xs font-medium"
                        style={{
                          borderColor: row.meeting_type === mt ? "var(--color-forest)" : "var(--color-line)",
                          background: row.meeting_type === mt ? "var(--color-frost-2)" : "white",
                          color: row.meeting_type === mt ? "var(--color-forest)" : "var(--color-ink)",
                        }}
                      >
                        {mt === "video" ? "Videosamtal" : "Telefonsamtal"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <EditableField label="Dag (ÅÅÅÅ-MM-DD)" value={row.day} onSave={(v) => saveBookingField(row, "day", v)} />
                  <EditableField label="Tid" value={row.time} onSave={(v) => saveBookingField(row, "time", v)} />
                </div>
                <EditableField label="Kontakt" value={row.contact} onSave={(v) => saveBookingField(row, "contact", v)} />
                <EditableField label="Anteckning" value={row.extra_note} onSave={(v) => saveBookingField(row, "extra_note", v)} />
                {row.topics.length > 0 && (
                  <div>
                    <div className="text-xs mb-1 text-slate uppercase tracking-wide">Gäller</div>
                    <div className="text-sm">{row.topics.join(", ")}</div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                  <button
                    onClick={() => setBookingStatus(row, row.status === "hanterad" ? "ny" : "hanterad")}
                    disabled={row.status === "avbokad"}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-forest border border-line disabled:opacity-40"
                  >
                    <Check size={13} /> Markera som {row.status === "hanterad" ? "ny" : "hanterad"}
                  </button>
                  {row.status !== "avbokad" && (
                    <button
                      onClick={() => setBookingStatus(row, "avbokad")}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-amber-deep border border-line"
                    >
                      <Ban size={13} /> Avboka
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete({ kind: "booking", id: row.id })}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-red-600 border border-line ml-auto"
                  >
                    <Trash2 size={13} /> Radera permanent
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-line flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <EditableField label="Skadetyp" value={row.skadetyp} onSave={(v) => saveClaimField(row, "skadetyp", v)} />
                  <EditableField
                    label="Allvarlighetsgrad"
                    value={row.allvarlighetsgrad}
                    onSave={(v) => saveClaimField(row, "allvarlighetsgrad", v)}
                  />
                </div>
                <div className="text-xs text-slate">
                  {row.photo_count} foto, {row.receipt_count} kvitton (bifogat av kunden, redigeras inte här)
                </div>
                {row.transcript.length > 0 && (
                  <div>
                    <div className="text-xs mb-1.5 text-slate uppercase tracking-wide">Chatthistorik</div>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto bd-scroll">
                      {row.transcript.map((m, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-semibold">{m.role === "user" ? "Kund" : "Buddy"}:</span> {m.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                  <button
                    onClick={() => setClaimStatus(row, row.status === "hanterad" ? "ny" : "hanterad")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-forest border border-line"
                  >
                    <Check size={13} /> Markera som {row.status === "hanterad" ? "ny" : "hanterad"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ kind: "claim", id: row.id })}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-red-600 border border-line ml-auto"
                  >
                    <Trash2 size={13} /> Radera permanent
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.kind === "booking" ? "Radera bokningen?" : "Radera skadeanmälan?"}
          body="Det här går inte att ångra."
          confirmLabel="Radera"
          onConfirm={runDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
