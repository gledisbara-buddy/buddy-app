"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useBuddy } from "@/lib/buddy-context";
import type { ItemKind } from "@/lib/items";

export function CategoryCta({ kind, label, className }: { kind: ItemKind; label: string; className: string }) {
  const { userType } = useBuddy();
  const href = userType ? `/onboarding?mode=add&kind=${kind}` : "/kom-igang";

  return (
    <Link href={href} className={className}>
      {label} <ArrowRight size={14} />
    </Link>
  );
}
