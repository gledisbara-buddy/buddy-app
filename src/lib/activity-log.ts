import { createClient } from "@/lib/supabase/client";

type Supabase = ReturnType<typeof createClient>;

// Skriver ett fält + en loggrad i samma sekvens, och räknar ett
// misslyckat logg-skriv som ett totalt misslyckande — medvetet
// strängare än appens vanliga toleranta logWriteError-mönster (se
// buddy-context.tsx), eftersom hela poängen med den här funktionen är
// att aldrig tyst tappa en ändring som rör personuppgifter.
export async function saveField(
  supabase: Supabase,
  params: {
    table: "profiles" | "items" | "policies" | "bookings" | "claims";
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
    old_value: oldValue == null ? null : String(oldValue),
    new_value: newValue == null ? null : String(newValue),
  });
  return !logError;
}
