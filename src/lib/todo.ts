import { CalendarDays, CircleSlash, FileSignature, HelpCircle, type LucideIcon } from "lucide-react";
import { groupForKind, isComparableItem, itemTitle, type InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";
import type { Profile, MissingInsuranceRequestRecord } from "@/lib/buddy-context";
import { daysUntilSwedishDate } from "@/lib/dates";

// Hur många dagar innan förfallodag en förnyelse dyker upp i listan.
const RENEWAL_WINDOW_DAYS = 45;

export type TodoItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  // Saknas href om raden bara är informativ (t.ex. "under hantering hos
  // Buddy") — kunden kan inte själv göra något åt den just nu.
  href?: string;
  urgent?: boolean;
};

// Slår ihop alla saker som faktiskt kräver kundens uppmärksamhet till en
// enda, prioriterad lista — ersätter dagens statiska "Mer att göra"-kort
// (fasta genvägar oavsett relevans) och det separata pendingCancellations-
// kortet i Dashboard.tsx.
export function buildTodoList({
  items,
  policies,
  profile,
  missingInsuranceRequests,
}: {
  items: InsuranceItem[];
  policies: Record<string, Quote>;
  profile: Profile | null;
  missingInsuranceRequests: MissingInsuranceRequestRecord[];
}): TodoItem[] {
  // 1. Förnyelser inom RENEWAL_WINDOW_DAYS — antingen från Quote.forfallodatum
  // (auto-hämtade, jämförbara poster) eller direkt från item.forfallodatum
  // (mobilabonnemang/prenumerationer, som aldrig får en Quote förrän de
  // faktiskt jämförs).
  const renewals = items
    .flatMap((item) => {
      const quote = policies[item.id];
      let forfallodatum: string | undefined;
      let bolag: string | undefined;
      if (isComparableItem(item) && quote?.source === "fetched" && quote.forfallodatum) {
        forfallodatum = quote.forfallodatum;
        bolag = quote.name;
      } else if ("forfallodatum" in item && item.forfallodatum) {
        forfallodatum = item.forfallodatum;
      }
      if (!forfallodatum) return [];
      const days = daysUntilSwedishDate(forfallodatum);
      if (days == null || days > RENEWAL_WINDOW_DAYS) return [];
      return [{ item, forfallodatum, bolag, days }];
    })
    .sort((a, b) => a.days - b.days)
    .map(
      ({ item, forfallodatum, bolag, days }): TodoItem => ({
        id: `renewal-${item.id}`,
        icon: CalendarDays,
        label: bolag ? `${itemTitle(item)} hos ${bolag} förnyas ${forfallodatum}` : `${itemTitle(item)} förnyas ${forfallodatum}`,
        sublabel: `Om ${days} ${days === 1 ? "dag" : "dagar"}`,
        href: `/compare/${item.id}`,
        urgent: days <= 14,
      })
    );

  // 2. Osignerad fullmakt — bara relevant om kunden redan har minst en
  // försäkringspost att låta Buddy agera på; annars känns påminnelsen
  // för tidig för ett helt nytt konto.
  const hasInsurance = items.some((item) => groupForKind(item.kind) === "forsakring");
  const fullmaktRow: TodoItem[] =
    hasInsurance && !profile?.fullmaktSignedAt
      ? [
          {
            id: "fullmakt",
            icon: FileSignature,
            label: "Signera fullmakten",
            sublabel: "Så kan Buddy hjälpa dig med dina försäkringar",
            href: "/importera",
          },
        ]
      : [];

  // 3. Öppna "saknad försäkring"-ärenden — hanteras av en anställd, ingen
  // åtgärd kunden själv kan ta, därför ingen href.
  const missingRows: TodoItem[] = missingInsuranceRequests
    .filter((r) => r.status === "ny")
    .map((r) => ({
      id: `missing-${r.id}`,
      icon: HelpCircle,
      label: "En försäkring du flaggat som saknad hanteras av Buddy",
      sublabel: "Under hantering",
    }));

  // 4. Pågående uppsägningar, satta av en anställd (CustomerItemsTab.tsx).
  const cancellationRows: TodoItem[] = items.flatMap((item) => {
    const quote = policies[item.id];
    if (!quote?.cancellationPending) return [];
    return [
      {
        id: `cancellation-${item.id}`,
        icon: CircleSlash,
        label: `Buddy hör av sig till ${quote.name} för att säga upp din ${itemTitle(item).toLowerCase()}`,
        sublabel: quote.forfallodatum ? `Till förfallodagen ${quote.forfallodatum}` : undefined,
      },
    ];
  });

  return [...renewals, ...fullmaktRow, ...missingRows, ...cancellationRows];
}
