import { LifeEventsView } from "@/components/LifeEventsView";
import type { LifeEventId } from "@/lib/life-events";

export default async function LivshandelserPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  const initialEvent: LifeEventId | undefined = event === "flytt" || event === "barn" ? event : undefined;
  return <LifeEventsView initialEvent={initialEvent} />;
}
