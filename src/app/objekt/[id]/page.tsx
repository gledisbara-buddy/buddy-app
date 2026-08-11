import { ItemDetail } from "@/components/ItemDetail";

export default async function ObjektPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ItemDetail itemId={id} />;
}
