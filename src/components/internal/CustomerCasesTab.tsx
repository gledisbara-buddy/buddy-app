"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  GitMerge,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/Overlay";
import { CaseAssignment } from "@/components/internal/CaseAssignment";
import { CaseChecklist } from "@/components/internal/CaseChecklist";
import { CaseComments } from "@/components/internal/CaseComments";
import { EditableField } from "@/components/internal/EditableField";
import { saveField } from "@/lib/activity-log";
import { sendTransactionalEmail } from "@/lib/email";
import { CLAIM_STATUS_LABELS, CLAIM_STATUS_STEPS, claimStatusColor, type ChatMessage, type ClaimStatus } from "@/lib/claim";

type Priority = "lag" | "normal" | "hog";

type CaseMeta = {
  assigned_to: string | null;
  priority: Priority;
  deadline: string | null;
  tags: string[];
  checklist: Record<string, boolean>;
  escalated_at: string | null;
};

type BookingRow = CaseMeta & {
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

type ClaimRow = CaseMeta & {
  id: string;
  transcript: ChatMessage[];
  photo_count: number;
  receipt_count: number;
  skadetyp: string | null;
  allvarlighetsgrad: string | null;
  status: ClaimStatus;
  created_at: string;
};

const PRIORITY_LABELS: Record<Priority, string> = { lag: "Låg", normal: "Normal", hog: "Hög" };
const todayIso = () => new Date().toISOString().slice(0, 10);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

function bookingStatusLabel(status: BookingRow["status"]): string {
  if (status === "ny") return "● Ny";
  if (status === "avbokad") return "● Avbokad";
  return "● Hanterad";
}

function bookingStatusColor(status: BookingRow["status"]): string {
  if (status === "ny") return "text-amber-deep";
  if (status === "avbokad") return "text-slate";
  return "text-forest";
}

function isBookingOpen(status: BookingRow["status"]): boolean {
  return status === "ny";
}
function isClaimOpen(status: ClaimStatus): boolean {
  return status !== "utbetald" && status !== "nekad";
}

// Delad meta-sektion (tilldelning, prioritet, deadline, taggar,
// checklista, eskalering) — identisk för bokningar och skador, så den
// byggs en gång och används i båda expanderade grenarna nedan istället
// för att duplicera samma UI två gånger.
function CaseMetaSection({
  caseType,
  meta,
  myEmail,
  onSave,
}: {
  caseType: "booking" | "claim";
  meta: CaseMeta;
  myEmail: string;
  onSave: (field: keyof CaseMeta, value: unknown) => void;
}) {
  const [tagDraft, setTagDraft] = useState("");

  const addTag = () => {
    const value = tagDraft.trim();
    if (!value || meta.tags.includes(value)) {
      setTagDraft("");
      return;
    }
    onSave("tags", [...meta.tags, value]);
    setTagDraft("");
  };

  return (
    <div className="flex flex-col gap-4 pt-4 border-t border-line">
      <div className="flex flex-wrap items-center gap-2">
        <CaseAssignment assignedTo={meta.assigned_to} myEmail={myEmail} onAssign={(email) => onSave("assigned_to", email)} />
        {meta.escalated_at ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={13} /> Eskalerad
            <button onClick={() => onSave("escalated_at", null)} aria-label="Ta bort eskalering">
              <X size={12} />
            </button>
          </span>
        ) : (
          <button
            onClick={() => {
              onSave("escalated_at", new Date().toISOString());
              onSave("priority", "hog");
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-line text-red-600"
          >
            <AlertTriangle size={13} /> Eskalera
          </button>
        )}
      </div>

      <div>
        <div className="text-xs mb-1.5 text-slate uppercase tracking-wide">Prioritet</div>
        <div className="flex gap-2">
          {(["lag", "normal", "hog"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onSave("priority", p)}
              className="px-3.5 py-1.5 rounded-full border text-xs font-medium"
              style={{
                borderColor: meta.priority === p ? "var(--color-forest)" : "var(--color-line)",
                background: meta.priority === p ? "var(--color-frost-2)" : "white",
                color: meta.priority === p ? "var(--color-forest)" : "var(--color-ink)",
              }}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs text-slate uppercase tracking-wide">Deadline</div>
          {meta.deadline && (
            <button onClick={() => onSave("deadline", null)} className="text-xs font-semibold text-slate hover:text-ink">
              Rensa
            </button>
          )}
        </div>
        <input
          type="date"
          value={meta.deadline ?? ""}
          onChange={(e) => onSave("deadline", e.target.value || null)}
          className="px-3 py-2 rounded-xl border border-line text-sm"
          style={meta.deadline && meta.deadline < todayIso() ? { borderColor: "#dc2626", color: "#dc2626" } : undefined}
        />
        {meta.deadline && meta.deadline < todayIso() && (
          <span className="ml-2 text-xs font-semibold text-red-600">Passerad</span>
        )}
      </div>

      <div>
        <div className="text-xs mb-1.5 text-slate uppercase tracking-wide">Taggar</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {meta.tags.map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-frost-2 text-forest">
              {t}
              <button onClick={() => onSave("tags", meta.tags.filter((x) => x !== t))} aria-label={`Ta bort taggen ${t}`}>
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="+ Lägg till tagg"
            className="text-xs px-2.5 py-1 rounded-full border border-line w-28 focus:w-40 transition-all"
          />
        </div>
      </div>

      <CaseChecklist
        caseType={caseType}
        checked={meta.checklist}
        onToggle={(itemId, value) => onSave("checklist", { ...meta.checklist, [itemId]: value })}
      />
    </div>
  );
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
  customerNotifyEmail,
  canDelete,
}: {
  customerId: string;
  actorEmail: string;
  customerEmail: string | null;
  customerNotifyEmail: boolean;
  canDelete: boolean;
}) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "booking" | "claim"; id: string } | null>(null);
  const [mergePickerFor, setMergePickerFor] = useState<{ kind: "booking" | "claim"; id: string } | null>(null);
  const [creating, setCreating] = useState<"booking" | "claim" | null>(null);
  const [newBookingDraft, setNewBookingDraft] = useState({ day: "", time: "", contact: customerEmail ?? "" });
  const [newClaimDraft, setNewClaimDraft] = useState({ skadetyp: "", allvarlighetsgrad: "" });

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
    if (ok && customerEmail && customerNotifyEmail) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) sendTransactionalEmail(token, { type: "claim_status_changed", to: customerEmail, status });
    }
  };

  const saveBookingField = async (row: BookingRow, field: keyof BookingRow, value: unknown) => {
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

  const saveClaimField = async (row: ClaimRow, field: keyof ClaimRow, value: unknown) => {
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

  const runMerge = async (duplicateId: string) => {
    if (!mergePickerFor) return;
    const { kind, id: targetId } = mergePickerFor;
    const supabase = createClient();
    await supabase.from("case_comments").update({ case_id: targetId }).eq("case_type", kind).eq("case_id", duplicateId);
    const table = kind === "booking" ? "bookings" : "claims";
    await supabase.from(table).delete().eq("id", duplicateId);
    if (kind === "booking") setBookings((prev) => prev.filter((b) => b.id !== duplicateId));
    else setClaims((prev) => prev.filter((c) => c.id !== duplicateId));
    await supabase.from("activity_log").insert({
      target_user_id: customerId,
      actor_email: actorEmail,
      table_name: table,
      field: "sammanslagen",
      old_value: duplicateId,
      new_value: targetId,
    });
    setMergePickerFor(null);
  };

  const createBooking = async () => {
    if (!newBookingDraft.day || !newBookingDraft.time || !newBookingDraft.contact) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: customerId,
        topics: [],
        extra_note: null,
        meeting_type: "video",
        day: newBookingDraft.day,
        time: newBookingDraft.time,
        contact: newBookingDraft.contact,
        status: "ny",
        assigned_to: actorEmail,
      })
      .select("*")
      .single();
    if (!error && data) {
      setBookings((prev) => [data as BookingRow, ...prev]);
      await supabase.from("activity_log").insert({
        target_user_id: customerId,
        actor_email: actorEmail,
        table_name: "bookings",
        field: "skapad",
        old_value: null,
        new_value: "Skapad manuellt av anställd",
      });
      setCreating(null);
      setNewBookingDraft({ day: "", time: "", contact: customerEmail ?? "" });
    }
  };

  const createClaim = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("claims")
      .insert({
        user_id: customerId,
        transcript: [],
        photo_count: 0,
        receipt_count: 0,
        skadetyp: newClaimDraft.skadetyp || null,
        allvarlighetsgrad: newClaimDraft.allvarlighetsgrad || null,
        status: "mottagen",
        assigned_to: actorEmail,
      })
      .select("*")
      .single();
    if (!error && data) {
      setClaims((prev) => [data as ClaimRow, ...prev]);
      await supabase.from("activity_log").insert({
        target_user_id: customerId,
        actor_email: actorEmail,
        table_name: "claims",
        field: "skapad",
        old_value: null,
        new_value: "Skapad manuellt av anställd",
      });
      setCreating(null);
      setNewClaimDraft({ skadetyp: "", allvarlighetsgrad: "" });
    }
  };

  const requests = [
    ...bookings.map((row) => ({ kind: "booking" as const, row })),
    ...claims.map((row) => ({ kind: "claim" as const, row })),
  ].sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-2">
        {creating === null ? (
          <>
            <button
              onClick={() => setCreating("booking")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-line text-forest"
            >
              <Plus size={13} /> Boka specialist
            </button>
            <button
              onClick={() => setCreating("claim")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-line text-forest"
            >
              <Plus size={13} /> Skadeanmälan
            </button>
          </>
        ) : null}
      </div>

      {creating === "booking" && (
        <div className="bg-white rounded-2xl border border-line p-4 flex flex-col gap-3">
          <div className="text-sm font-semibold">Nytt möte</div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={newBookingDraft.day}
              onChange={(e) => setNewBookingDraft((d) => ({ ...d, day: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-line text-sm"
            />
            <input
              type="time"
              value={newBookingDraft.time}
              onChange={(e) => setNewBookingDraft((d) => ({ ...d, time: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-line text-sm"
            />
          </div>
          <input
            value={newBookingDraft.contact}
            onChange={(e) => setNewBookingDraft((d) => ({ ...d, contact: e.target.value }))}
            placeholder="Kontaktuppgift"
            className="px-3 py-2 rounded-xl border border-line text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={createBooking}
              disabled={!newBookingDraft.day || !newBookingDraft.time || !newBookingDraft.contact}
              className="bd-btn flex-1 py-2 rounded-full text-xs font-semibold text-white bg-forest disabled:opacity-40"
            >
              Skapa
            </button>
            <button onClick={() => setCreating(null)} className="flex-1 py-2 rounded-full text-xs font-semibold text-slate">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {creating === "claim" && (
        <div className="bg-white rounded-2xl border border-line p-4 flex flex-col gap-3">
          <div className="text-sm font-semibold">Ny skadeanmälan</div>
          <input
            value={newClaimDraft.skadetyp}
            onChange={(e) => setNewClaimDraft((d) => ({ ...d, skadetyp: e.target.value }))}
            placeholder="Skadetyp"
            className="px-3 py-2 rounded-xl border border-line text-sm"
          />
          <input
            value={newClaimDraft.allvarlighetsgrad}
            onChange={(e) => setNewClaimDraft((d) => ({ ...d, allvarlighetsgrad: e.target.value }))}
            placeholder="Allvarlighetsgrad"
            className="px-3 py-2 rounded-xl border border-line text-sm"
          />
          <div className="flex gap-2">
            <button onClick={createClaim} className="bd-btn flex-1 py-2 rounded-full text-xs font-semibold text-white bg-forest">
              Skapa
            </button>
            <button onClick={() => setCreating(null)} className="flex-1 py-2 rounded-full text-xs font-semibold text-slate">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {requests.length === 0 && <p className="text-sm text-slate">Inga ärenden än.</p>}

      {requests.map(({ kind, row }) => {
        const key = `${kind}-${row.id}`;
        const expanded = expandedKey === key;
        const overdue = row.deadline && row.deadline < todayIso() && (kind === "booking" ? isBookingOpen(row.status as BookingRow["status"]) : isClaimOpen(row.status as ClaimStatus));
        const otherSameKind = kind === "booking" ? bookings.filter((b) => b.id !== row.id) : claims.filter((c) => c.id !== row.id);

        return (
          <div key={key} className="bg-white rounded-2xl border border-line p-4">
            <button onClick={() => setExpandedKey(expanded ? null : key)} className="w-full flex items-start justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                  {kind === "booking" ? <Calendar size={14} className="text-forest" /> : <ShieldAlert size={14} className="text-forest" />}
                </div>
                <div>
                  <div className="text-sm font-semibold">{kind === "booking" ? "Boka specialist" : "Skadeanmälan"}</div>
                  <div className="text-xs text-slate flex items-center gap-1.5 flex-wrap">
                    {formatDate(row.created_at)}
                    {row.priority === "hog" && <span className="text-red-600 font-semibold">· Hög prioritet</span>}
                    {row.escalated_at && <span className="text-red-600 font-semibold">· Eskalerad</span>}
                    {overdue && <span className="text-red-600 font-semibold">· Deadline passerad</span>}
                    {row.assigned_to && <span>· {row.assigned_to === actorEmail ? "Tilldelad dig" : `Tilldelad ${row.assigned_to}`}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-none">
                {kind === "booking" ? (
                  <span className={`text-xs font-semibold ${bookingStatusColor(row.status)}`}>{bookingStatusLabel(row.status)}</span>
                ) : (
                  <span className={`text-xs font-semibold ${claimStatusColor(row.status)}`}>
                    ● {CLAIM_STATUS_LABELS[row.status]}
                  </span>
                )}
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
                  {canDelete && otherSameKind.length > 0 && (
                    <button
                      onClick={() => setMergePickerFor({ kind: "booking", id: row.id })}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-ink border border-line"
                    >
                      <GitMerge size={13} /> Slå ihop
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setConfirmDelete({ kind: "booking", id: row.id })}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-red-600 border border-line ml-auto"
                    >
                      <Trash2 size={13} /> Radera permanent
                    </button>
                  )}
                </div>

                <CaseMetaSection caseType="booking" meta={row} myEmail={actorEmail} onSave={(field, value) => saveBookingField(row, field, value)} />

                <div className="pt-4 border-t border-line">
                  <CaseComments caseType="booking" caseId={row.id} actorEmail={actorEmail} />
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

                <div className="pt-2 border-t border-line">
                  <div className="text-xs mb-2 text-slate uppercase tracking-wide">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {CLAIM_STATUS_STEPS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setClaimStatus(row, s)}
                        className="px-3 py-1.5 rounded-full border text-xs font-medium"
                        style={{
                          borderColor: row.status === s ? "var(--color-forest)" : "var(--color-line)",
                          background: row.status === s ? "var(--color-frost-2)" : "white",
                          color: row.status === s ? "var(--color-forest)" : "var(--color-ink)",
                        }}
                      >
                        {CLAIM_STATUS_LABELS[s]}
                      </button>
                    ))}
                    <button
                      onClick={() => setClaimStatus(row, "nekad")}
                      className="px-3 py-1.5 rounded-full border text-xs font-medium"
                      style={{
                        borderColor: row.status === "nekad" ? "#dc2626" : "var(--color-line)",
                        background: row.status === "nekad" ? "#fef2f2" : "white",
                        color: row.status === "nekad" ? "#dc2626" : "var(--color-ink)",
                      }}
                    >
                      Nekad
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                  {canDelete && otherSameKind.length > 0 && (
                    <button
                      onClick={() => setMergePickerFor({ kind: "claim", id: row.id })}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-ink border border-line"
                    >
                      <GitMerge size={13} /> Slå ihop
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setConfirmDelete({ kind: "claim", id: row.id })}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-red-600 border border-line ml-auto"
                    >
                      <Trash2 size={13} /> Radera permanent
                    </button>
                  )}
                </div>

                <CaseMetaSection caseType="claim" meta={row} myEmail={actorEmail} onSave={(field, value) => saveClaimField(row, field, value)} />

                <div className="pt-4 border-t border-line">
                  <CaseComments caseType="claim" caseId={row.id} actorEmail={actorEmail} />
                </div>
              </div>
            )}

            {mergePickerFor && mergePickerFor.id === row.id && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="text-xs mb-2 text-slate uppercase tracking-wide">Slå ihop med</div>
                <div className="flex flex-col gap-1.5">
                  {otherSameKind.map((other) => (
                    <button
                      key={other.id}
                      onClick={() => runMerge(other.id)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl border border-line text-left text-sm hover:bg-frost"
                    >
                      <span>{formatDate(other.created_at)}</span>
                      <span className="text-xs text-slate">
                        {kind === "booking" ? bookingStatusLabel((other as BookingRow).status) : CLAIM_STATUS_LABELS[(other as ClaimRow).status]}
                      </span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setMergePickerFor(null)} className="text-xs font-semibold text-slate mt-2">
                  Avbryt
                </button>
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
