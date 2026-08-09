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
  referralCode?: string;
};

// Räknat via två SECURITY DEFINER-funktioner i Supabase (count_referral_signups
// / count_qualified_referrals) — exponerar aldrig rådata om andra
// användares profiler, bara summerade tal.
export type ReferralStats = { total: number; qualified: number };

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

// Kundens egna bokningar/anmälningar, för "Mina ärenden" — inte samma sak
// som Booking/ClaimInput ovan (det kunden skickar in), utan det som läses
// tillbaka från Supabase efteråt, inklusive status satt av en anställd.
export type BookingRecord = {
  id: string;
  topics: string[];
  extraNote: string | null;
  meetingType: "video" | "phone";
  day: string;
  time: string;
  status: "ny" | "hanterad";
  createdAt: string;
};

export type ClaimRecord = {
  id: string;
  photoCount: number;
  receiptCount: number;
  skadetyp: string | null;
  allvarlighetsgrad: string | null;
  status: "ny" | "hanterad";
  createdAt: string;
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
  // Sparade behovsanalys-svar per sak, så en kund slipper göra om analysen
  // varje gång den öppnar jämförelsen igen. Omvalideras mot aktuell
  // undertyp av CompareFlow vid inläsning, inte här.
  itemNeeds: Record<string, string[]>;
  saveItemNeeds: (itemId: string, needs: string[]) => void;
  // Skiljer lägg-in-fasen från jämför-fasen — sätts till true när kunden
  // uttryckligen säger att den är redo, låses aldrig om under sessionen.
  readyToCompare: boolean;
  setReadyToCompare: (ready: boolean) => void;
  // Sant om e-posten finns i `employees`-tabellen — styr åtkomst till /internt.
  isEmployee: boolean;
  referralStats: ReferralStats | null;
  // Sant vid 5+ kvalificerade värvningar (lagt till en sak + nått
  // jämförelseresultat) — styr rätten till kostnadsfri hjälp vid
  // skadereglering, se ClaimFlow.tsx/InternalView.tsx.
  hasClaimPerk: boolean;
  bookings: BookingRecord[];
  claims: ClaimRecord[];
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
  referral_code: string | null;
};

type ItemRow = { kind: string; data: InsuranceItem; needs: string[] | null };
type PolicyRow = { item_id: string; data: Quote };

type BookingRow = {
  id: string;
  topics: string[];
  extra_note: string | null;
  meeting_type: "video" | "phone";
  day: string;
  time: string;
  status: "ny" | "hanterad";
  created_at: string;
};

type ClaimRow = {
  id: string;
  photo_count: number;
  receipt_count: number;
  skadetyp: string | null;
  allvarlighetsgrad: string | null;
  status: "ny" | "hanterad";
  created_at: string;
};

function mapBookingRow(r: BookingRow): BookingRecord {
  return {
    id: r.id,
    topics: r.topics,
    extraNote: r.extra_note,
    meetingType: r.meeting_type,
    day: r.day,
    time: r.time,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapClaimRow(r: ClaimRow): ClaimRecord {
  return {
    id: r.id,
    photoCount: r.photo_count,
    receiptCount: r.receipt_count,
    skadetyp: r.skadetyp,
    allvarlighetsgrad: r.allvarlighetsgrad,
    status: r.status,
    createdAt: r.created_at,
  };
}

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
  const [itemNeeds, setItemNeeds] = useState<Record<string, string[]>>({});
  const [readyToCompare, setReadyToCompareState] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);

  const resetLocalState = () => {
    setUserId(null);
    setUserType(null);
    setProfile(null);
    setItems([]);
    setPolicies({});
    setItemNeeds({});
    setReadyToCompareState(false);
    setIsEmployee(false);
    setReferralStats(null);
    setBookings([]);
    setClaims([]);
  };

  const loadForUser = useCallback(
    async (uid: string, email: string | undefined) => {
      const [
        { data: profileRow },
        { data: itemRows },
        { data: policyRows },
        { data: employeeRow },
        { data: bookingRows },
        { data: claimRows },
        { data: referralTotal },
        { data: referralQualified },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_type, name, personnummer, phone, ready_to_compare, referral_code")
          .eq("id", uid)
          .single(),
        supabase.from("items").select("kind, data, needs").eq("user_id", uid),
        supabase.from("policies").select("item_id, data").eq("user_id", uid),
        email ? supabase.from("employees").select("email").eq("email", email).maybeSingle() : Promise.resolve({ data: null }),
        supabase
          .from("bookings")
          .select("id, topics, extra_note, meeting_type, day, time, status, created_at")
          .eq("user_id", uid)
          .order("day", { ascending: true }),
        supabase
          .from("claims")
          .select("id, photo_count, receipt_count, skadetyp, allvarlighetsgrad, status, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase.rpc("count_referral_signups", { referrer: uid }),
        supabase.rpc("count_qualified_referrals", { referrer: uid }),
      ]);

      if (profileRow) {
        const row = profileRow as ProfileRow;
        setUserType(row.user_type);
        setProfile({
          name: row.name,
          personnummer: row.personnummer ?? undefined,
          phone: row.phone ?? undefined,
          email,
          referralCode: row.referral_code ?? undefined,
        });
        setReadyToCompareState(row.ready_to_compare);
      }
      const itemRowsTyped = (itemRows ?? []) as ItemRow[];
      setItems(itemRowsTyped.map((r) => r.data));
      setItemNeeds(
        Object.fromEntries(itemRowsTyped.filter((r) => r.needs && r.needs.length > 0).map((r) => [r.data.id, r.needs as string[]]))
      );
      setPolicies(Object.fromEntries(((policyRows ?? []) as PolicyRow[]).map((r) => [r.item_id, r.data])));
      setIsEmployee(!!employeeRow);
      setReferralStats({ total: (referralTotal as number | null) ?? 0, qualified: (referralQualified as number | null) ?? 0 });
      setBookings(((bookingRows ?? []) as BookingRow[]).map(mapBookingRow));
      setClaims(((claimRows ?? []) as ClaimRow[]).map(mapClaimRow));
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
      if (patch.referralCode !== undefined) dbPatch.referral_code = patch.referralCode;
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
      setItemNeeds((prev) => {
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

  const saveItemNeeds = useCallback(
    (itemId: string, needs: string[]) => {
      setItemNeeds((prev) => ({ ...prev, [itemId]: needs }));
      if (!userId) return;
      supabase.from("items").update({ needs }).eq("id", itemId).then(logWriteError("behov"));
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
        .select("id, topics, extra_note, meeting_type, day, time, status, created_at")
        .single()
        .then((result) => {
          logWriteError("bokning")(result);
          if (result.data) setBookings((prev) => [...prev, mapBookingRow(result.data as BookingRow)]);
        });
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
        .select("id, photo_count, receipt_count, skadetyp, allvarlighetsgrad, status, created_at")
        .single()
        .then((result) => {
          logWriteError("skadeanmälan")(result);
          if (result.data) setClaims((prev) => [mapClaimRow(result.data as ClaimRow), ...prev]);
        });
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
      itemNeeds,
      saveItemNeeds,
      readyToCompare,
      setReadyToCompare,
      isEmployee,
      referralStats,
      hasClaimPerk: (referralStats?.qualified ?? 0) >= 5,
      bookings,
      claims,
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
      itemNeeds,
      saveItemNeeds,
      readyToCompare,
      setReadyToCompare,
      isEmployee,
      referralStats,
      bookings,
      claims,
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
