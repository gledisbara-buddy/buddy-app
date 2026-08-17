// Supabase Auth-fel kommer alltid på engelska, oavsett projektspråk — och
// var för tekniska/interna för att visa rakt av i en annars helsvensk app
// (t.ex. "Invalid login credentials"). Matchar på kända delsträngar
// eftersom Supabase inte exponerar stabila felkoder till klienten, bara
// meddelandetext. Okänt fel faller tillbaka på en generisk svensk text
// istället för att någonsin visa den råa engelska strängen.
const KNOWN_ERRORS: { match: string; message: string }[] = [
  { match: "Invalid login credentials", message: "Fel e-post eller lösenord." },
  { match: "User already registered", message: "Det finns redan ett konto med den här e-postadressen." },
  { match: "Email not confirmed", message: "Du behöver bekräfta din e-postadress innan du kan logga in — kolla din inkorg." },
  { match: "Password should be at least", message: "Lösenordet måste vara minst 6 tecken." },
  { match: "Unable to validate email address", message: "E-postadressen ser inte korrekt ut." },
  { match: "For security purposes", message: "Vänta en liten stund innan du försöker igen." },
  { match: "same as the old password", message: "Det nya lösenordet måste skilja sig från det gamla." },
];

export function translateAuthError(rawMessage: string): string {
  const known = KNOWN_ERRORS.find((e) => rawMessage.includes(e.match));
  return known?.message ?? "Något gick fel just nu. Försök igen om en liten stund.";
}
