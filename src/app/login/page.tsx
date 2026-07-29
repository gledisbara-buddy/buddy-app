import { redirect } from "next/navigation";
import { BankIdLogin } from "@/components/BankIdLogin";
import type { UserType } from "@/lib/types";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  if (type !== "privat" && type !== "foretag") {
    redirect("/");
  }

  return <BankIdLogin userType={type as UserType} />;
}
