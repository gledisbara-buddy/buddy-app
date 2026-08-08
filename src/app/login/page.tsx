import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import type { UserType } from "@/lib/types";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  if (type !== "privat" && type !== "foretag") {
    redirect("/kom-igang");
  }

  return <AuthForm userType={type as UserType} />;
}
