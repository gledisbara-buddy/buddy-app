import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Skickar bara ett fast antal fördefinierade mall-typer (aldrig fritt
// subject/body från klienten) — annars vore routen en öppen relä som
// vem som helst kunde använda för att skicka godtycklig text till
// godtyckliga adresser via Buddys Resend-konto.
type EmailBody =
  | { type: "booking_confirmation"; to: string; day: string; time: string; meetingType: "video" | "phone" }
  | { type: "claim_status_changed"; to: string; status: "hanterad" | "ny" }
  | { type: "cancellation_confirmation"; to: string; bolag: string; forfallodatum?: string };

function buildEmail(body: EmailBody): { subject: string; html: string } {
  switch (body.type) {
    case "booking_confirmation":
      return {
        subject: "Ditt möte med Buddy är bokat",
        html: `<p>Hej!</p><p>Ditt ${body.meetingType === "video" ? "videosamtal" : "telefonsamtal"} med en rådgivare från Buddy är bokat till <strong>${body.day} kl. ${body.time}</strong>.</p><p>Se detaljer eller avboka under "Mina ärenden" i din översikt.</p><p>/ Buddy</p>`,
      };
    case "claim_status_changed":
      return {
        subject: body.status === "hanterad" ? "Din skadeanmälan är hanterad" : "Din skadeanmälan har öppnats igen",
        html:
          body.status === "hanterad"
            ? `<p>Hej!</p><p>Din skadeanmälan hos Buddy har nu markerats som hanterad. Logga in för att se detaljer.</p><p>/ Buddy</p>`
            : `<p>Hej!</p><p>Din skadeanmälan hos Buddy är öppnad igen och tittas på av en handläggare.</p><p>/ Buddy</p>`,
      };
    case "cancellation_confirmation":
      return {
        subject: "Buddy säger upp ditt avtal",
        html: `<p>Hej!</p><p>Buddy hör av sig till <strong>${body.bolag}</strong> för att säga upp ditt avtal${body.forfallodatum ? ` till förfallodagen ${body.forfallodatum}` : ""}.</p><p>Avtalet gäller som vanligt tills dess. Du kan se status under din översikt.</p><p>/ Buddy</p>`,
      };
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization header." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user?.email) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const body = (await request.json()) as EmailBody;
  if (!body?.to || !body.type) {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Skicka till sig själv är alltid tillåtet. Skicka till någon ANNAN
  // kräver att anroparen är anställd — samma princip som employees-RLS:
  // en rad kan bara läsas av sig själv, så uppslaget avslöjar aldrig
  // vilka andra som är anställda.
  if (body.to !== user.email) {
    const { data: employeeRow } = await supabase.from("employees").select("email").eq("email", user.email).maybeSingle();
    if (!employeeRow) {
      return NextResponse.json({ error: "Not allowed to email this recipient." }, { status: 403 });
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const { subject, html } = buildEmail(body);

  if (!apiKey) {
    console.log(`[send-email] RESEND_API_KEY saknas, loggar bara: ${body.type} -> ${body.to}`);
    return NextResponse.json({ sent: false, reason: "not_configured" });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Buddy <buddy@minbuddy.se>",
    to: body.to,
    subject,
    html,
  });

  if (error) {
    console.error("[send-email] Resend error", error);
    return NextResponse.json({ error: "Failed to send email." }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
