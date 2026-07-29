"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserType } from "@/lib/types";
import type { Quote } from "@/lib/quote";
import type { InsuranceItem } from "@/lib/items";

export type Profile = {
  name: string;
  priority: string | null;
};

type BuddyState = {
  userType: UserType | null;
  setUserType: (userType: UserType) => void;
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  items: InsuranceItem[];
  addItem: (item: InsuranceItem) => void;
  removeItem: (id: string) => void;
  policies: Record<string, Quote>;
  setPolicy: (insuranceId: string, quote: Quote) => void;
};

const BuddyContext = createContext<BuddyState | null>(null);

export function BuddyProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<InsuranceItem[]>([]);
  const [policies, setPolicies] = useState<Record<string, Quote>>({});

  const addItem = (item: InsuranceItem) => setItems((prev) => [...prev, item]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setPolicy = (insuranceId: string, quote: Quote) =>
    setPolicies((prev) => ({ ...prev, [insuranceId]: quote }));

  const value = useMemo(
    () => ({
      userType,
      setUserType,
      profile,
      setProfile,
      items,
      addItem,
      removeItem,
      policies,
      setPolicy,
    }),
    [userType, profile, items, policies]
  );

  return <BuddyContext.Provider value={value}>{children}</BuddyContext.Provider>;
}

export function useBuddy() {
  const ctx = useContext(BuddyContext);
  if (!ctx) throw new Error("useBuddy must be used within BuddyProvider");
  return ctx;
}
