import { ClaimFlow } from "@/components/ClaimFlow";

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  return <ClaimFlow initialItemTitle={item} />;
}
