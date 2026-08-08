"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
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
  // Sant fram tills den första sessions-kontrollen mot Supabase är klar —
  // guardade sidor ska vänta med att redirecta till /kom-igang tills dess.
  loading: boolean;
  userType: UserType | null;
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

type ProfileRow = {
  user_type: UserType;
  name: string;
  priority: string | null;
  personnummer: string | null;
  phone: string | null;
  ready_to_compare: boolean;
};

type ItemRow = { kind: string; data: InsuranceItem };
type PolicyRow = { item_id: string; data: Quote };

function logWriteError(label: string) {
  return (result: { error: { message: string } | null }) => {
    if (result.error) console.error(`Buddy: kunde inte spara (${label})`, result.error.message);
  };
}

export function BuddyProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<InsuranceItem[]>([]);
  const [policies, setPolicies] = useState<Record<string, Quote>>({});
  const [readyToCompare, setReadyToCompareState] = useState(false);

  const resetLocalState = () => {
    setUserId(null);
    setUserType(null);
    setProfile(null);
    setItems([]);
    setPolicies({});
    setReadyToCompareState(false);
  };

  const loadForUser = useCallback(
    async (uid: string, email: string | undefined) => {
      const [{ data: profileRow }, { data: itemRows }, { data: policyRows }] = await Promise.all([
        supabase.from("profiles").select("user_type, name, priority, personnummer, phone, ready_to_compare").eq("id", uid).single(),
        supabase.from("items").select("kind, data").eq("user_id", uid),
        supabase.from("policies").select("item_id, data").eq("user_id", uid),
      ]);

      if (profileRow) {
        const row = profileRow as ProfileRow;
        setUserType(row.user_type);
        setProfile({
          name: row.name,
          priority: row.priority,
          personnummer: row.personnummer ?? undefined,
          phone: row.phone ?? undefined,
          email,
        });
        setReadyToCompareState(row.ready_to_compare);
      }
      setItems(((itemRows ?? []) as ItemRow[]).map((r) => r.data));
      setPolicies(Object.fromEntries(((policyRows ?? []) as PolicyRow[]).map((r) => [r.item_id, r.data])));
    },
    [supabase]
  );

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        setUserId(session.user.id);
        await loadForUser(session.user.id, session.user.email);
      }
      if (active) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        resetLocalState();
        return;
      }
      // Bara SIGNED_IN (färsk in-/registrering) ska trigga en omladdning —
      // annars blinkar guardade sidor till /kom-igang varje gång ett
      // TOKEN_REFRESHED-event kommer i bakgrunden (var ~50:e minut).
      if (event === "SIGNED_IN" && session?.user) {
        setLoading(true);
        setUserId(session.user.id);
        await loadForUser(session.user.id, session.user.email);
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadForUser]);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setProfile((prev) => ({ name: "", priority: null, ...prev, ...patch }));
      if (!userId) return;
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.priority !== undefined) dbPatch.priority = patch.priority;
      if (patch.personnummer !== undefined) dbPatch.personnummer = patch.personnummer;
      if (patch.phone !== undefined) dbPatch.phone = patch.phone;
      if (Object.keys(dbPatch).length > 0) {
        supabase.from("profiles").update(dbPatch).eq("id", userId).then(logWriteError("profil"));
      }
    },
    [supabase, userId]
  );

  const addItem = useCallback(
    (item: InsuranceItem) => {
      setItems((prev) => [...prev, item]);
      if (!userId) return;
      supabase
        .from("items")
        .insert({ id: item.id, user_id: userId, kind: item.kind, data: item })
        .then(logWriteError("sak"));
    },
    [supabase, userId]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setPolicies((prev) => {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
      if (!userId) return;
      supabase.from("items").delete().eq("id", id).then(logWriteError("borttagning"));
    },
    [supabase, userId]
  );

  const setPolicy = useCallback(
    (insuranceId: string, quote: Quote) => {
      setPolicies((prev) => ({ ...prev, [insuranceId]: quote }));
      if (!userId) return;
      supabase
        .from("policies")
        .upsert({ item_id: insuranceId, user_id: userId, data: quote })
        .then(logWriteError("offert"));
    },
    [supabase, userId]
  );

  const setReadyToCompare = useCallback(
    (ready: boolean) => {
      setReadyToCompareState(ready);
      if (!userId) return;
      supabase.from("profiles").update({ ready_to_compare: ready }).eq("id", userId).then(logWriteError("jämförelseläge"));
    },
    [supabase, userId]
  );

  const logout = useCallback(() => {
    supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({
      loading,
      userType,
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
    [
      loading,
      userType,
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
    ]
  );

  return <BuddyContext.Provider value={value}>{children}</BuddyContext.Provider>;
}

export function useBuddy() {
  const ctx = useContext(BuddyContext);
  if (!ctx) throw new Error("useBuddy must be used within BuddyProvider");
  return ctx;
}
