"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserType } from "@/lib/types";

export type OnboardData = {
  selected: string[];
  priority: string | null;
  name: string;
};

type BuddyState = {
  userType: UserType | null;
  setUserType: (userType: UserType) => void;
  onboardData: OnboardData | null;
  setOnboardData: (data: OnboardData) => void;
};

const BuddyContext = createContext<BuddyState | null>(null);

export function BuddyProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [onboardData, setOnboardData] = useState<OnboardData | null>(null);

  const value = useMemo(
    () => ({ userType, setUserType, onboardData, setOnboardData }),
    [userType, onboardData]
  );

  return <BuddyContext.Provider value={value}>{children}</BuddyContext.Provider>;
}

export function useBuddy() {
  const ctx = useContext(BuddyContext);
  if (!ctx) throw new Error("useBuddy must be used within BuddyProvider");
  return ctx;
}
