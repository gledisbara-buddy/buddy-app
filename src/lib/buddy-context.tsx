"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserType } from "@/lib/types";
import type { Quote } from "@/lib/quote";
import type { InsuranceItem, ItemKind } from "@/lib/items";
import type { ChatMessage, ClaimStatus } from "@/lib/claim";
import { generateHouseholdCode, type HouseholdRelation } from "@/lib/household";
import { sendTransactionalEmail } from "@/lib/email";
import { generateCode } from "@/lib/referral";

export type Profile = {
  name: string;
  personnummer?: string;
  email?: string;
  phone?: string;
  referralCode?: string;
  fullmaktSignedAt?: string;
  fullmaktPdfPath?: string;
  memberSince?: string;
  notifyEmail?: boolean;
  notifySms?: boolean;
  language?: "sv" | "en";
};

// null skiljer sig från undefined här: null = rensa fältet i databasen,
// undefined = rör inte fältet alls. Krävs för att updateProfile ska kunna
// skriva NULL till en kolumn istället för att bara hoppa över den, se
// ProfilePage.tsx:s handleSave.
export type ProfilePatch = Partial<Omit<Profile, "email" | "personnummer" | "phone">> & {
  personnummer?: string | null;
  phone?: string | null;
};

// Räknat via två SECURITY DEFINER-funktioner i Supabase (count_referral_signups
// / count_qualified_referrals) — exponerar aldrig rådata om andra
// användares profiler, bara summerade tal.
export type ReferralStats = { total: number; qualified: number };

// Uppgifterna som samlas in i CompareFlow.tsx:s teckna-flöde innan ett
// avtal faktiskt sparas. Bara betalningstyp, aldrig kontouppgifter — se
// CompareFlow.tsx för resonemanget.
export type CheckoutInfo = {
  name: string;
  personnummer: string;
  betalningsmetod: "autogiro" | "faktura" | "efaktura";
  hasOldPolicy: boolean;
  oldBolag?: string;
  oldAvtalsnummer?: string;
  wantsCancellationHelp?: boolean;
};

// Hushållet är ett separat begrepp från de försäkringsobjekt av typen
// "person" som redan finns i items.ts (barn/partner som skydds-objekt,
// inte egna inloggningar) — se src/lib/household.ts.
export type HouseholdMember = { id: string; name: string; relation: HouseholdRelation | null };
export type Household = {
  id: string;
  name: string;
  inviteCode: string;
  relation: HouseholdRelation | null; // den inloggades egen roll i hushållet
  members: HouseholdMember[]; // ko-medlemmar, inte en själv
};

// Hushåll v2 (Del I i docs/kundresa-v2-steg2-plan.md): personnummer +
// dubbelt godkännande, ersätter den kod-baserade gå-med-flödet. En
// HouseholdRequest är en INKOMMANDE förfrågan kunden själv kan
// godkänna/neka; en SentHouseholdRequest är en den själv har SKICKAT.
// Avslöjar aldrig om det angivna personnumret matchade en befintlig kund
// — se request_household_join() i schema.sql.
export type HouseholdRequest = {
  id: string;
  householdId: string;
  householdName: string;
  requestedByName: string;
  relation: HouseholdRelation | null;
  createdAt: string;
};
export type SentHouseholdRequest = {
  id: string;
  personnummer: string;
  relation: HouseholdRelation | null;
  status: "pending" | "approved" | "declined";
  createdAt: string;
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
  status: "ny" | "hanterad" | "avbokad";
  createdAt: string;
};

export type ClaimRecord = {
  id: string;
  photoCount: number;
  receiptCount: number;
  skadetyp: string | null;
  allvarlighetsgrad: string | null;
  status: ClaimStatus;
  createdAt: string;
};

// Kunden flaggar en försäkring som saknades i BankID-importen
// (BankIdImport.tsx) — en anställd fyller i den manuellt i internverktyget
// (MissingInsuranceQueue.tsx), samma "ny"→"hanterad" mönster som bookings/
// claims.
export type MissingInsuranceRequestRecord = {
  id: string;
  kind: ItemKind;
  note: string | null;
  status: "ny" | "hanterad" | "avbrutet";
  createdAt: string;
};

type BuddyState = {
  // Sant fram tills den första sessions-kontrollen mot Supabase är klar —
  // guardade sidor ska vänta med att redirecta till /kom-igang tills dess.
  loading: boolean;
  userType: UserType | null;
  // Den råa Supabase auth-id:t — behövs för Storage-sökvägar (t.ex.
  // fullmakter/{userId}/fullmakt.pdf) där RLS-policyn matchar mot mappnamnet.
  userId: string | null;
  profile: Profile | null;
  // `email` kommer alltid från Supabase Auth (den riktiga inloggningsmejlen)
  // och kan inte skrivas via profiles-tabellen — se ProfilePage för hur en
  // riktig mejländring görs (supabase.auth.updateUser).
  updateProfile: (patch: ProfilePatch) => void;
  // Sätts av FullmaktSigning.tsx efter en lyckad signering — skiljs från
  // updateProfile eftersom den även behöver skriva ett server-satt
  // tidsstämpel, inte bara ett client-valt fält.
  recordFullmaktSigned: (pdfPath: string) => void;
  // Null om kunden inte har gått med i eller skapat ett hushåll än.
  household: Household | null;
  createHousehold: (name: string) => Promise<boolean>;
  leaveHousehold: () => void;
  removeHouseholdMember: (memberId: string) => Promise<boolean>;
  // Hushåll v2 — se HouseholdRequest/SentHouseholdRequest ovan.
  householdRequests: HouseholdRequest[];
  sentHouseholdRequests: SentHouseholdRequest[];
  requestHouseholdJoin: (personnummer: string, relation: HouseholdRelation) => Promise<boolean>;
  respondToHouseholdRequest: (requestId: string, approve: boolean) => Promise<boolean>;
  items: InsuranceItem[];
  addItem: (item: InsuranceItem) => Promise<void>;
  updateItem: (item: InsuranceItem) => void;
  addItems: (items: InsuranceItem[]) => Promise<void>;
  removeItem: (id: string) => void;
  policies: Record<string, Quote>;
  setPolicy: (insuranceId: string, quote: Quote, checkout?: CheckoutInfo) => void;
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
  cancelBooking: (id: string) => void;
  submitClaim: (input: ClaimInput) => void;
  missingInsuranceRequests: MissingInsuranceRequestRecord[];
  submitMissingInsuranceRequest: (kind: ItemKind, note: string) => void;
  // GDPR-radering (SettingsPage.tsx) — sant om kunden har ett obesvarat
  // raderingsärende, se account_deletion_requests i schema.sql.
  accountDeletionRequested: boolean;
  submitAccountDeletionRequest: () => void;
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
  fullmakt_signed_at: string | null;
  fullmakt_pdf_path: string | null;
  created_at: string;
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
  status: "ny" | "hanterad" | "avbokad";
  created_at: string;
};

type ClaimRow = {
  id: string;
  photo_count: number;
  receipt_count: number;
  skadetyp: string | null;
  allvarlighetsgrad: string | null;
  status: ClaimStatus;
  created_at: string;
};

type MissingInsuranceRequestRow = {
  id: string;
  kind: string;
  note: string | null;
  status: "ny" | "hanterad" | "avbrutet";
  created_at: string;
};

type HouseholdRpcRow = {
  id: string;
  name: string;
  invite_code: string;
  my_relation: HouseholdRelation | null;
  members: HouseholdMember[] | null;
};

function mapHouseholdRow(row: HouseholdRpcRow): Household {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    relation: row.my_relation,
    members: row.members ?? [],
  };
}

type HouseholdRequestRow = {
  id: string;
  household_id: string;
  household_name: string;
  requested_by_name: string;
  relation: HouseholdRelation | null;
  created_at: string;
};

function mapHouseholdRequestRow(r: HouseholdRequestRow): HouseholdRequest {
  return {
    id: r.id,
    householdId: r.household_id,
    householdName: r.household_name,
    requestedByName: r.requested_by_name,
    relation: r.relation,
    createdAt: r.created_at,
  };
}

type SentHouseholdRequestRow = {
  id: string;
  requested_personnummer: string;
  relation: HouseholdRelation | null;
  status: "pending" | "approved" | "declined";
  created_at: string;
};

function mapSentHouseholdRequestRow(r: SentHouseholdRequestRow): SentHouseholdRequest {
  return {
    id: r.id,
    personnummer: r.requested_personnummer,
    relation: r.relation,
    status: r.status,
    createdAt: r.created_at,
  };
}

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

function mapMissingInsuranceRequestRow(r: MissingInsuranceRequestRow): MissingInsuranceRequestRecord {
  return {
    id: r.id,
    kind: r.kind as ItemKind,
    note: r.note,
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
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdRequests, setHouseholdRequests] = useState<HouseholdRequest[]>([]);
  const [sentHouseholdRequests, setSentHouseholdRequests] = useState<SentHouseholdRequest[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [missingInsuranceRequests, setMissingInsuranceRequests] = useState<MissingInsuranceRequestRecord[]>([]);
  const [accountDeletionRequested, setAccountDeletionRequested] = useState(false);

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
    setHousehold(null);
    setHouseholdRequests([]);
    setSentHouseholdRequests([]);
    setBookings([]);
    setClaims([]);
    setMissingInsuranceRequests([]);
    setAccountDeletionRequested(false);
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
        { data: householdRow },
        { data: missingInsuranceRows },
        { data: householdRequestRows },
        { data: sentHouseholdRequestRows },
        { data: deletionRequestRows },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_type, name, personnummer, phone, ready_to_compare, referral_code, fullmakt_signed_at, fullmakt_pdf_path, created_at")
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
        supabase.rpc("get_my_household").maybeSingle(),
        supabase
          .from("missing_insurance_requests")
          .select("id, kind, note, status, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase.rpc("get_my_household_requests"),
        supabase.rpc("get_my_sent_household_requests"),
        supabase.from("account_deletion_requests").select("id").eq("user_id", uid).eq("status", "pending").limit(1),
      ]);

      if (profileRow) {
        const row = profileRow as ProfileRow;
        // Värvningskoden genererades tidigare i onboardingens namn-steg
        // (som inte längre körs — namnet sätts numera direkt vid
        // registrering). Fångar upp profiler som har ett namn men
        // fortfarande saknar en kod, en gång per inloggning.
        const referralCode = row.referral_code ?? (row.name ? generateCode(row.name) : undefined);
        setUserType(row.user_type);
        setProfile({
          name: row.name,
          personnummer: row.personnummer ?? undefined,
          phone: row.phone ?? undefined,
          email,
          referralCode,
          fullmaktSignedAt: row.fullmakt_signed_at ?? undefined,
          fullmaktPdfPath: row.fullmakt_pdf_path ?? undefined,
          memberSince: row.created_at,
        });
        setReadyToCompareState(row.ready_to_compare);
        if (!row.referral_code && referralCode) {
          supabase.from("profiles").update({ referral_code: referralCode }).eq("id", uid).then(logWriteError("värvningskod"));
        }
      }
      const itemRowsTyped = (itemRows ?? []) as ItemRow[];
      setItems(itemRowsTyped.map((r) => r.data));
      setItemNeeds(
        Object.fromEntries(itemRowsTyped.filter((r) => r.needs && r.needs.length > 0).map((r) => [r.data.id, r.needs as string[]]))
      );
      setPolicies(Object.fromEntries(((policyRows ?? []) as PolicyRow[]).map((r) => [r.item_id, r.data])));
      setIsEmployee(!!employeeRow);
      setReferralStats({ total: (referralTotal as number | null) ?? 0, qualified: (referralQualified as number | null) ?? 0 });
      setHousehold(householdRow ? mapHouseholdRow(householdRow as HouseholdRpcRow) : null);
      setHouseholdRequests(((householdRequestRows ?? []) as HouseholdRequestRow[]).map(mapHouseholdRequestRow));
      setSentHouseholdRequests(((sentHouseholdRequestRows ?? []) as SentHouseholdRequestRow[]).map(mapSentHouseholdRequestRow));
      setAccountDeletionRequested(((deletionRequestRows ?? []) as { id: string }[]).length > 0);
      setBookings(((bookingRows ?? []) as BookingRow[]).map(mapBookingRow));
      setClaims(((claimRows ?? []) as ClaimRow[]).map(mapClaimRow));
      setMissingInsuranceRequests(((missingInsuranceRows ?? []) as MissingInsuranceRequestRow[]).map(mapMissingInsuranceRequestRow));
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
    (patch: ProfilePatch) => {
      setProfile((prev) => {
        const base = { name: "", ...prev, ...patch };
        return { ...base, personnummer: base.personnummer ?? undefined, phone: base.phone ?? undefined };
      });
      if (!userId) return;
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.personnummer !== undefined) dbPatch.personnummer = patch.personnummer;
      if (patch.phone !== undefined) dbPatch.phone = patch.phone;
      if (patch.referralCode !== undefined) dbPatch.referral_code = patch.referralCode;
      if (patch.notifyEmail !== undefined) dbPatch.notify_email = patch.notifyEmail;
      if (patch.notifySms !== undefined) dbPatch.notify_sms = patch.notifySms;
      if (patch.language !== undefined) dbPatch.language = patch.language;
      if (Object.keys(dbPatch).length > 0) {
        supabase.from("profiles").update(dbPatch).eq("id", userId).then(logWriteError("profil"));
      }
    },
    [supabase, userId]
  );

  const recordFullmaktSigned = useCallback(
    (pdfPath: string) => {
      const signedAt = new Date().toISOString();
      setProfile((prev) => (prev ? { ...prev, fullmaktSignedAt: signedAt, fullmaktPdfPath: pdfPath } : prev));
      if (!userId) return;
      supabase
        .from("profiles")
        .update({ fullmakt_signed_at: signedAt, fullmakt_pdf_path: pdfPath })
        .eq("id", userId)
        .then(logWriteError("fullmakt"));
      // Tillskrivande logg, se fullmakt_history i schema.sql — får aldrig
      // blockera huvudskrivningen ovan om den misslyckas.
      supabase
        .from("fullmakt_history")
        .insert({ user_id: userId, pdf_path: pdfPath, signed_at: signedAt })
        .then(logWriteError("fullmaktshistorik"));
    },
    [supabase, userId]
  );

  const createHousehold = useCallback(
    async (name: string): Promise<boolean> => {
      if (!userId) return false;
      const insertOnce = () =>
        supabase
          .from("households")
          .insert({ name: name.trim(), invite_code: generateHouseholdCode(name || profile?.name), created_by: userId })
          .select("id, name, invite_code")
          .single();

      let { data, error } = await insertOnce();
      if (error) ({ data, error } = await insertOnce());
      if (error || !data) return false;

      const row = data as { id: string; name: string; invite_code: string };
      const { error: linkError } = await supabase.from("profiles").update({ household_id: row.id }).eq("id", userId);
      if (linkError) return false;

      setHousehold({ id: row.id, name: row.name, inviteCode: row.invite_code, relation: null, members: [] });
      return true;
    },
    [supabase, userId, profile?.name]
  );

  // Hushåll v2 — skickar en förfrågan istället för att gå med direkt.
  // Avslöjar aldrig (varken i UI:t eller här) om personnumret matchade en
  // befintlig kund — se request_household_join() i schema.sql.
  const requestHouseholdJoin = useCallback(
    async (personnummer: string, relation: HouseholdRelation): Promise<boolean> => {
      if (!userId || !household) return false;
      const { error } = await supabase.rpc("request_household_join", {
        p_household_id: household.id,
        p_personnummer: personnummer.trim(),
        p_relation: relation,
      });
      if (error) return false;

      const { data } = await supabase.rpc("get_my_sent_household_requests");
      setSentHouseholdRequests(((data ?? []) as SentHouseholdRequestRow[]).map(mapSentHouseholdRequestRow));
      return true;
    },
    [supabase, userId, household]
  );

  const respondToHouseholdRequest = useCallback(
    async (requestId: string, approve: boolean): Promise<boolean> => {
      if (!userId) return false;
      const { error } = await supabase.rpc("respond_household_request", { p_request_id: requestId, p_approve: approve });
      if (error) return false;

      setHouseholdRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (approve) {
        const { data: hh } = await supabase.rpc("get_my_household").maybeSingle();
        if (hh) setHousehold(mapHouseholdRow(hh as HouseholdRpcRow));
      }
      return true;
    },
    [supabase, userId]
  );

  const leaveHousehold = useCallback(() => {
    setHousehold(null);
    if (!userId) return;
    supabase
      .from("profiles")
      .update({ household_id: null, household_relation: null })
      .eq("id", userId)
      .then(logWriteError("hushåll"));
  }, [supabase, userId]);

  // Symmetriskt — vem som helst i hushållet kan koppla loss vem som helst
  // annan, inget ägarbegrepp i den här modellen (medvetet val, se
  // remove_household_member() i schema.sql). Optimistisk lokal borttagning
  // + återhämtar den riktiga listan i bakgrunden ifall RPC:en skulle
  // misslyckas (fel hushåll, redan borttagen av någon annan, etc.).
  const removeHouseholdMember = useCallback(
    async (memberId: string): Promise<boolean> => {
      setHousehold((prev) => (prev ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) } : prev));
      const { data, error } = await supabase.rpc("remove_household_member", { member_id: memberId });
      if (error || !data) {
        const { data: hh } = await supabase.rpc("get_my_household").maybeSingle();
        setHousehold(hh ? mapHouseholdRow(hh as HouseholdRpcRow) : null);
        return false;
      }
      return true;
    },
    [supabase]
  );

  // Returnerar ett Promise så anroparen kan vänta in att items-raden faktiskt
  // finns i databasen innan den sätter policy för den — policies.item_id har
  // en foreign key mot items.id, så en efterföljande setPolicy() som körs
  // innan den här inserten hunnit committa kan annars krascha mot det
  // constraintet (sett live vid BankID-importen och auto-hämtningsflödet).
  const addItem = useCallback(
    async (item: InsuranceItem) => {
      setItems((prev) => [...prev, item]);
      if (!userId) return;
      const result = await supabase
        .from("items")
        .insert({ id: item.id, user_id: userId, kind: item.kind, data: item });
      logWriteError("sak")(result);
    },
    [supabase, userId]
  );

  // Redigerar en befintlig sak på plats (samma id) istället för att ta
  // bort och lägga till på nytt — så att policy_history, policies och
  // Historik-sektionen i ItemDetail.tsx fortfarande hör ihop med samma
  // item_id efteråt.
  const updateItem = useCallback(
    (item: InsuranceItem) => {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      if (!userId) return;
      supabase.from("items").update({ kind: item.kind, data: item }).eq("id", item.id).then(logWriteError("sak"));
    },
    [supabase, userId]
  );

  // Bulk-variant för BankID-importen (BankIdImport.tsx) — en state-uppdatering
  // och ETT batchat insert istället för att loopa addItem N gånger.
  const addItems = useCallback(
    async (newItems: InsuranceItem[]) => {
      if (newItems.length === 0) return;
      setItems((prev) => [...prev, ...newItems]);
      if (!userId) return;
      const result = await supabase
        .from("items")
        .insert(newItems.map((item) => ({ id: item.id, user_id: userId, kind: item.kind, data: item })));
      logWriteError("saker")(result);
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
    (insuranceId: string, quote: Quote, checkout?: CheckoutInfo) => {
      setPolicies((prev) => ({ ...prev, [insuranceId]: quote }));
      if (!userId) return;
      const row: Record<string, unknown> = { item_id: insuranceId, user_id: userId, data: quote };
      if (checkout) row.checkout = checkout;
      supabase.from("policies").upsert(row).then(logWriteError("offert"));
      // policies är ett upsert (bara senaste raden) — policy_history är en
      // separat, tillskrivande logg av samma händelse, se schema.sql. Får
      // aldrig blockera huvudskrivningen ovan om den misslyckas.
      supabase
        .from("policy_history")
        .insert({ item_id: insuranceId, user_id: userId, data: quote })
        .then(logWriteError("offerthistorik"));
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
        .then(async (result) => {
          logWriteError("bokning")(result);
          if (result.data) setBookings((prev) => [...prev, mapBookingRow(result.data as BookingRow)]);
          if (result.data && profile?.email && profile.notifyEmail !== false) {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            if (token) {
              sendTransactionalEmail(token, {
                type: "booking_confirmation",
                to: profile.email,
                day: input.day,
                time: input.time,
                meetingType: input.meetingType,
              });
            }
          }
        });
    },
    [supabase, userId, profile]
  );

  const cancelBooking = useCallback(
    (id: string) => {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "avbokad" } : b)));
      if (!userId) return;
      supabase.from("bookings").update({ status: "avbokad" }).eq("id", id).then(logWriteError("avbokning"));
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

  const submitMissingInsuranceRequest = useCallback(
    (kind: ItemKind, note: string) => {
      if (!userId) return;
      supabase
        .from("missing_insurance_requests")
        .insert({ user_id: userId, kind, note: note.trim() || null })
        .select("id, kind, note, status, created_at")
        .single()
        .then((result) => {
          logWriteError("saknad försäkring")(result);
          if (result.data) {
            setMissingInsuranceRequests((prev) => [
              mapMissingInsuranceRequestRow(result.data as MissingInsuranceRequestRow),
              ...prev,
            ]);
          }
        });
    },
    [supabase, userId]
  );

  const submitAccountDeletionRequest = useCallback(() => {
    if (!userId) return;
    setAccountDeletionRequested(true);
    supabase
      .from("account_deletion_requests")
      .insert({ user_id: userId })
      .then(logWriteError("raderingsbegäran"));
  }, [supabase, userId]);

  const logout = useCallback(() => {
    supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({
      loading,
      userType,
      userId,
      profile,
      updateProfile,
      recordFullmaktSigned,
      household,
      createHousehold,
      leaveHousehold,
      removeHouseholdMember,
      householdRequests,
      sentHouseholdRequests,
      requestHouseholdJoin,
      respondToHouseholdRequest,
      items,
      addItem,
      updateItem,
      addItems,
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
      cancelBooking,
      submitClaim,
      missingInsuranceRequests,
      submitMissingInsuranceRequest,
      accountDeletionRequested,
      submitAccountDeletionRequest,
      logout,
    }),
    [
      loading,
      userType,
      userId,
      profile,
      updateProfile,
      recordFullmaktSigned,
      household,
      createHousehold,
      leaveHousehold,
      removeHouseholdMember,
      householdRequests,
      sentHouseholdRequests,
      requestHouseholdJoin,
      respondToHouseholdRequest,
      items,
      addItem,
      updateItem,
      addItems,
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
      cancelBooking,
      submitClaim,
      missingInsuranceRequests,
      submitMissingInsuranceRequest,
      accountDeletionRequested,
      submitAccountDeletionRequest,
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
