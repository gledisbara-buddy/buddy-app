import { LifeEventsView } from "@/components/LifeEventsView";
import type { LifeEventId } from "@/lib/life-events";

export default async function LivshandelserPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  const VALID_EVENTS: LifeEventId[] = ["flytt", "barn", "fordon", "djur"];
  const initialEvent = VALID_EVENTS.includes(event as LifeEventId) ? (event as LifeEventId) : undefined;
  return <LifeEventsView initialEvent={initialEvent} />;
}
