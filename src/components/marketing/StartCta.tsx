"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useBuddy } from "@/lib/buddy-context";

export function StartCta({ className }: { className: string }) {
  const { userType } = useBuddy();

  return (
    <Link href={userType ? "/dashboard" : "/kom-igang"} className={className}>
      {userType ? "Till min översikt" : "Kom igång"} <ArrowRight size={16} />
    </Link>
  );
}
