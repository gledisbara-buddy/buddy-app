import { BookSpecialist } from "@/components/BookSpecialist";
import { FIXED_TOPICS } from "@/lib/booking";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const initialTopic = FIXED_TOPICS.some((t) => t.id === topic) ? topic : undefined;
  return <BookSpecialist initialTopic={initialTopic} />;
}
