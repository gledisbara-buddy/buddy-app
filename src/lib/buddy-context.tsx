"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserType } from "@/lib/types";
import type { Quote } from "@/lib/quote";
import type { InsuranceItem } from "@/lib/items";

export type Profile = {
  name: string;
  priority: string | null;
  personnummer?: string;
  email?: string;
  phone?: string;
};

type BuddyState = {
  userType: UserType | null;
  setUserType: (userType: UserType) => void;
  profile: Profile | null;
  updateProfile: (patch: Partial<Profile>) => void;
  items: InsuranceItem[];
  addItem: (item: InsuranceItem) => void;
  removeItem: (id: string) => void;
  policies: Record<string, Quote>;
  setPolicy: (insuranceId: string, quote: Quote) => void;
  // Skiljer lägg-in-fasen från jämför-fasen — sätts till true när kunden
  // uttryckligen säger att den är redo, låses aldrig om under sessionen.
  readyToCompare: boolean;
  setReadyToCompare: (ready: boolean) => void;
  logout: () => void;
};

const BuddyContext = createContext<BuddyState | null>(null);

export function BuddyProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<InsuranceItem[]>([]);
  const [policies, setPolicies] = useState<Record<string, Quote>>({});
  const [readyToCompare, setReadyToCompare] = useState(false);

  const updateProfile = (patch: Partial<Profile>) =>
    setProfile((prev) => ({ name: "", priority: null, ...prev, ...patch }));
  const addItem = (item: InsuranceItem) => setItems((prev) => [...prev, item]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setPolicy = (insuranceId: string, quote: Quote) =>
    setPolicies((prev) => ({ ...prev, [insuranceId]: quote }));
  const logout = () => {
    setUserType(null);
    setProfile(null);
    setItems([]);
    setPolicies({});
    setReadyToCompare(false);
  };

  const value = useMemo(
    () => ({
      userType,
      setUserType,
      profile,
      updateProfile,
      items,
      addItem,
      removeItem,
      policies,
      setPolicy,
      readyToCompare,
      setReadyToCompare,
      logout,
    }),
    [userType, profile, items, policies, readyToCompare]
  );

  return <BuddyContext.Provider value={value}>{children}</BuddyContext.Provider>;
}

export function useBuddy() {
  const ctx = useContext(BuddyContext);
  if (!ctx) throw new Error("useBuddy must be used within BuddyProvider");
  return ctx;
}
