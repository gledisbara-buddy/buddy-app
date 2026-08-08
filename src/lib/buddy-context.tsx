"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserType } from "@/lib/types";
import type { Quote } from "@/lib/quote";
import type { InsuranceItem } from "@/lib/items";
import type { ChatMessage } from "@/lib/claim";

export type Profile = {
  name: string;
  personnummer?: string;
  email?: string;
  phone?: string;
};

export type BookingInput = {
  topics: string[];
  extraNote: string;
  meetingType: "video" | "phone";
  day: string; // ISO-datum (YYYY-MM-DD)
  time: string;
  contact: string;
};

export type ClaimInput = {
  transcript: ChatMessage[];
  photoCount: number;
  receiptCount: number;
  skadetyp?: string;
  allvarlighetsgrad?: string;
};

type BuddyState = {
  // Sant fram tills den första sessions-kontrollen mot Supabase är klar —
  // guardade sidor ska vänta med att redirecta till /kom-igang tills dess.
  loading: boolean;
  userType: UserType | null;
  profile: Profile | null;
  // `email` kommer alltid från Supabase Auth (den riktiga inloggningsmejlen)
  // och kan inte skrivas via profiles-tabellen — se ProfilePage för hur en
  // riktig mejländring görs (supabase.auth.updateUser).
  updateProfile: (patch: Partial<Omit<Profile, "email">>) => void;
  items: InsuranceItem[];
  addItem: (item: InsuranceItem) => void;
  removeItem: (id: string) => void;
  policies: Record<string, Quote>;
  setPolicy: (insuranceId: string, quote: Quote) => void;
  // Skiljer lägg-in-fasen från jämför-fasen — sätts till true när kunden
  // uttryckligen säger att den är redo, låses aldrig om under sessionen.
  readyToCompare: boolean;
  setReadyToCompare: (ready: boolean) => void;
  // Sant om e-posten finns i `employees`-tabellen — styr åtkomst till /internt.
  isEmployee: boolean;
  submitBooking: (input: BookingInput) => void;
  submitClaim: (input: ClaimInput) => void;
  logout: () => void;
};

const BuddyContext = createContext<BuddyState | null>(null);

type ProfileRow = {
  user_type: UserType;
  name: string;
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
  const [isEmployee, setIsEmployee] = useState(false);

  const resetLocalState = () => {
    setUserId(null);
    setUserType(null);
    setProfile(null);
    setItems([]);
    setPolicies({});
    setReadyToCompareState(false);
    setIsEmployee(false);
  };

  const loadForUser = useCallback(
    async (uid: string, email: string | undefined) => {
      const [{ data: profileRow }, { data: itemRows }, { data: policyRows }, { data: employeeRow }] = await Promise.all([
        supabase.from("profiles").select("user_type, name, personnummer, phone, ready_to_compare").eq("id", uid).single(),
        supabase.from("items").select("kind, data").eq("user_id", uid),
        supabase.from("policies").select("item_id, data").eq("user_id", uid),
        email ? supabase.from("employees").select("email").eq("email", email).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      if (profileRow) {
        const row = profileRow as ProfileRow;
        setUserType(row.user_type);
        setProfile({
          name: row.name,
          personnummer: row.personnummer ?? undefined,
          phone: row.phone ?? undefined,
          email,
        });
        setReadyToCompareState(row.ready_to_compare);
      }
      setItems(((itemRows ?? []) as ItemRow[]).map((r) => r.data));
      setPolicies(Object.fromEntries(((policyRows ?? []) as PolicyRow[]).map((r) => [r.item_id, r.data])));
      setIsEmployee(!!employeeRow);
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
    (patch: Partial<Omit<Profile, "email">>) => {
      setProfile((prev) => ({ name: "", ...prev, ...patch }));
      if (!userId) return;
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
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

  const submitBooking = useCallback(
    (input: BookingInput) => {
      if (!userId) return;
      supabase
        .from("bookings")
        .insert({
          user_id: userId,
          topics: input.topics,
          extra_note: input.extraNote || null,
          meeting_type: input.meetingType,
          day: input.day,
          time: input.time,
          contact: input.contact,
        })
        .then(logWriteError("bokning"));
    },
    [supabase, userId]
  );

  const submitClaim = useCallback(
    (input: ClaimInput) => {
      if (!userId) return;
      supabase
        .from("claims")
        .insert({
          user_id: userId,
          transcript: input.transcript,
          photo_count: input.photoCount,
          receipt_count: input.receiptCount,
          skadetyp: input.skadetyp ?? null,
          allvarlighetsgrad: input.allvarlighetsgrad ?? null,
        })
        .then(logWriteError("skadeanmälan"));
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
      isEmployee,
      submitBooking,
      submitClaim,
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
      isEmployee,
      submitBooking,
      submitClaim,
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
