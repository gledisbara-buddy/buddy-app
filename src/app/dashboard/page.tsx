import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ intro?: string }>;
}) {
  const { intro } = await searchParams;
  return <Dashboard showIntro={intro === "1"} />;
}
