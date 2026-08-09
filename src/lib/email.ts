// Transaktionsmejl till kunder. Skickas via /api/send-email (server-side,
// håller RESEND_API_KEY) — klienten känner redan mottagarens e-post (den
// öppna kundens profil), så routen behöver ingen egen Supabase-åtkomst.
// Saknas API-nyckeln loggas mejlet bara bort server-side, resten av flödet
// (bokning/skadeanmälan/uppsägning) påverkas inte.

export type EmailPayload =
  | { type: "booking_confirmation"; to: string; day: string; time: string; meetingType: "video" | "phone" }
  | { type: "claim_status_changed"; to: string; status: "hanterad" | "ny" }
  | { type: "cancellation_confirmation"; to: string; bolag: string; forfallodatum?: string };

export async function sendTransactionalEmail(accessToken: string, payload: EmailPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
