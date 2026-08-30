import { createClient } from "@/lib/supabase/client";
import { maskPersonnummer } from "@/lib/personnummer";

type Supabase = ReturnType<typeof createClient>;

// Loggraden är läsbar av VARJE anställd (activity_log_select_employee har
// inget behörighetsfilter, till skillnad från customer_profile_view) —
// utan den här maskeringen skulle en kundservice-anställd kunna läsa ett
// fullt personnummer i klartext i Aktivitet-fliken så fort en admin/
// specialist redigerar det, vilket helt kringgår maskeringen som
// customer_profile_view annars ger. Samma format som den vyn använder.
function redactLoggedValue(field: string, value: unknown): string | null {
  if (value == null) return null;
  const str = String(value);
  return field === "personnummer" ? maskPersonnummer(str) : str;
}

// Skriver ett fält + en loggrad i samma sekvens, och räknar ett
// misslyckat logg-skriv som ett totalt misslyckande — medvetet
// strängare än appens vanliga toleranta logWriteError-mönster (se
// buddy-context.tsx), eftersom hela poängen med den här funktionen är
// att aldrig tyst tappa en ändring som rör personuppgifter.
export async function saveField(
  supabase: Supabase,
  params: {
    table: "profiles" | "items" | "policies" | "bookings" | "claims" | "missing_insurance_requests" | "account_deletion_requests";
    idColumn: string;
    id: string;
    targetUserId: string;
    actorEmail: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }
): Promise<boolean> {
  const { table, idColumn, id, targetUserId, actorEmail, field, oldValue, newValue } = params;

  const { error: updateError } = await supabase
    .from(table)
    .update({ [field]: newValue })
    .eq(idColumn, id);
  if (updateError) return false;

  const { error: logError } = await supabase.from("activity_log").insert({
    target_user_id: targetUserId,
    actor_email: actorEmail,
    table_name: table,
    field,
    old_value: redactLoggedValue(field, oldValue),
    new_value: redactLoggedValue(field, newValue),
  });
  return !logError;
}
