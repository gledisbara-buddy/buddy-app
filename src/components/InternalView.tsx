"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Calendar, Check, Search, ShieldAlert } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";
import { itemSummary, itemTitle, type InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";
import type { ChatMessage } from "@/lib/claim";

type BookingRow = {
  id: string;
  user_id: string;
  topics: string[];
  extra_note: string | null;
  meeting_type: "video" | "phone";
  day: string;
  time: string;
  contact: string;
  status: "ny" | "hanterad";
  created_at: string;
};

type ClaimRow = {
  id: string;
  user_id: string;
  transcript: ChatMessage[];
  photo_count: number;
  receipt_count: number;
  skadetyp: string | null;
  allvarlighetsgrad: string | null;
  status: "ny" | "hanterad";
  created_at: string;
};

type ProfileLookup = { id: string; email: string | null; name: string };

const FIXED_TOPIC_LABELS: Record<string, string> = { OVRIGT: "Övrigt", HELHET: "Total helhetslösning" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

export function InternalView() {
  const router = useRouter();
  const { userType, loading, isEmployee } = useBuddy();
  const [tab, setTab] = useState<"forfragningar" | "kundsok">("forfragningar");

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLookup>>({});
  const [itemTitlesById, setItemTitlesById] = useState<Record<string, string>>({});
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileLookup[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ProfileLookup | null>(null);
  const [customerItems, setCustomerItems] = useState<InsuranceItem[]>([]);
  const [customerPolicies, setCustomerPolicies] = useState<Record<string, Quote>>({});

  useEffect(() => {
    if (!loading && (!userType || !isEmployee)) router.replace("/dashboard");
  }, [loading, userType, isEmployee, router]);

  useEffect(() => {
    if (loading || !isEmployee) return;
    const supabase = createClient();
    (async () => {
      setRequestsLoading(true);
      const [{ data: bookingRows }, { data: claimRows }] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("claims").select("*").order("created_at", { ascending: false }),
      ]);
      const bRows = (bookingRows ?? []) as BookingRow[];
      const cRows = (claimRows ?? []) as ClaimRow[];
      setBookings(bRows);
      setClaims(cRows);

      const userIds = Array.from(new Set([...bRows.map((r) => r.user_id), ...cRows.map((r) => r.user_id)]));
      const itemTopicIds = Array.from(new Set(bRows.flatMap((r) => r.topics).filter((t) => !FIXED_TOPIC_LABELS[t])));

      const [{ data: profileRows }, { data: topicItemRows }] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles").select("id, email, name").in("id", userIds)
          : Promise.resolve({ data: [] as ProfileLookup[] }),
        itemTopicIds.length > 0
          ? supabase.from("items").select("id, data").in("id", itemTopicIds)
          : Promise.resolve({ data: [] as { id: string; data: InsuranceItem }[] }),
      ]);

      setProfilesById(Object.fromEntries(((profileRows ?? []) as ProfileLookup[]).map((p) => [p.id, p])));
      setItemTitlesById(
        Object.fromEntries(
          ((topicItemRows ?? []) as { id: string; data: InsuranceItem }[]).map((r) => [r.id, itemTitle(r.data)])
        )
      );
      setRequestsLoading(false);
    })();
  }, [loading, isEmployee]);

  const topicLabel = (id: string) => FIXED_TOPIC_LABELS[id] ?? itemTitlesById[id] ?? id;

  const toggleBookingStatus = async (row: BookingRow) => {
    const nextStatus = row.status === "ny" ? "hanterad" : "ny";
    const supabase = createClient();
    await supabase.from("bookings").update({ status: nextStatus }).eq("id", row.id);
    setBookings((prev) => prev.map((b) => (b.id === row.id ? { ...b, status: nextStatus } : b)));
  };

  const toggleClaimStatus = async (row: ClaimRow) => {
    const nextStatus = row.status === "ny" ? "hanterad" : "ny";
    const supabase = createClient();
    await supabase.from("claims").update({ status: nextStatus }).eq("id", row.id);
    setClaims((prev) => prev.map((c) => (c.id === row.id ? { ...c, status: nextStatus } : c)));
  };

  const runSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    setSelectedCustomer(null);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, email, name")
      .ilike("email", `%${searchQuery.trim()}%`)
      .limit(10);
    setSearchResults((data ?? []) as ProfileLookup[]);
    setSearching(false);
  };

  const openCustomer = async (customer: ProfileLookup) => {
    setSelectedCustomer(customer);
    const supabase = createClient();
    const [{ data: itemRows }, { data: policyRows }] = await Promise.all([
      supabase.from("items").select("data").eq("user_id", customer.id),
      supabase.from("policies").select("item_id, data").eq("user_id", customer.id),
    ]);
    setCustomerItems(((itemRows ?? []) as { data: InsuranceItem }[]).map((r) => r.data));
    setCustomerPolicies(
      Object.fromEntries(((policyRows ?? []) as { item_id: string; data: Quote }[]).map((r) => [r.item_id, r.data]))
    );
  };

  if (loading || !userType || !isEmployee) return null;

  const requests = [
    ...bookings.map((row) => ({ kind: "booking" as const, row })),
    ...claims.map((row) => ({ kind: "claim" as const, row })),
  ].sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-3xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Internt</span>
        <h1 className="bd-display text-3xl mt-2 mb-6">Anställdvy</h1>

        <div className="flex items-center gap-1 mb-6 p-1 rounded-full w-fit bg-frost-2">
          <button
            onClick={() => setTab("forfragningar")}
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
            style={
              tab === "forfragningar"
                ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                : { color: "var(--color-slate)" }
            }
          >
            Förfrågningar
          </button>
          <button
            onClick={() => setTab("kundsok")}
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
            style={
              tab === "kundsok"
                ? { background: "white", color: "var(--color-ink)", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
                : { color: "var(--color-slate)" }
            }
          >
            Kundsök
          </button>
        </div>

        {tab === "forfragningar" ? (
          requestsLoading ? (
            <p className="text-sm text-slate">Laddar…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate">Inga förfrågningar än.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map(({ kind, row }) => {
                const requester = profilesById[row.user_id];
                return (
                  <div key={`${kind}-${row.id}`} className="bg-white rounded-2xl border border-line p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                          {kind === "booking" ? (
                            <Calendar size={16} className="text-forest" />
                          ) : (
                            <ShieldAlert size={16} className="text-forest" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {kind === "booking" ? "Boka specialist" : "Skadeanmälan"}
                          </div>
                          <div className="text-xs text-slate">
                            {requester?.name || requester?.email || row.user_id} · {formatDate(row.created_at)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold flex-none ${row.status === "ny" ? "text-amber-deep" : "text-forest"}`}
                      >
                        {row.status === "ny" ? "● Ny" : "● Hanterad"}
                      </span>
                    </div>

                    {kind === "booking" ? (
                      <div className="text-sm text-ink mb-3">
                        <div>
                          {row.meeting_type === "video" ? "Videosamtal" : "Telefonsamtal"} — {formatDate(row.day)} kl.{" "}
                          {row.time}
                        </div>
                        <div className="text-slate">Kontakt: {row.contact}</div>
                        {row.topics.length > 0 && (
                          <div className="text-slate">Gäller: {row.topics.map(topicLabel).join(", ")}</div>
                        )}
                        {row.extra_note && <div className="text-slate">{`"${row.extra_note}"`}</div>}
                      </div>
                    ) : (
                      <div className="text-sm text-ink mb-3">
                        <div>
                          {row.skadetyp ?? "Okänd skadetyp"} · {row.allvarlighetsgrad ?? "–"}
                        </div>
                        <div className="text-slate">
                          {row.photo_count} foto, {row.receipt_count} kvitton
                        </div>
                        <div className="text-slate">
                          {row.transcript
                            .filter((m) => m.role === "user")
                            .map((m) => m.content)
                            .join(" ")}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => (kind === "booking" ? toggleBookingStatus(row) : toggleClaimStatus(row))}
                      className="text-sm font-semibold flex items-center gap-1 text-forest"
                    >
                      <Check size={14} /> Markera som {row.status === "ny" ? "hanterad" : "ny"}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div>
            <div className="flex gap-2 mb-6">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="sam@exempel.se"
                className="flex-1 px-4 py-3 rounded-xl border border-line text-[15px]"
              />
              <button
                onClick={runSearch}
                className="bd-btn px-5 rounded-xl font-semibold text-white bg-forest flex items-center gap-2"
              >
                <Search size={15} /> Sök
              </button>
            </div>

            {searching && <p className="text-sm text-slate">Söker…</p>}

            {!selectedCustomer && searchResults.length > 0 && (
              <div className="flex flex-col gap-2 mb-6">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openCustomer(p)}
                    className="bg-white rounded-2xl border border-line p-4 text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold">{p.name || "(Namn saknas)"}</div>
                      <div className="text-xs text-slate">{p.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCustomer && (
              <div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-sm font-semibold text-slate hover:text-ink mb-4"
                >
                  ← Tillbaka till sökresultat
                </button>
                <div className="bg-white rounded-2xl border border-line p-5 mb-4">
                  <div className="font-semibold text-[15px]">{selectedCustomer.name || "(Namn saknas)"}</div>
                  <div className="text-sm text-slate">{selectedCustomer.email}</div>
                </div>
                {customerItems.length === 0 ? (
                  <p className="text-sm text-slate">Inget tillagt än.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {customerItems.map((item) => {
                      const signed = customerPolicies[item.id];
                      return (
                        <div key={item.id} className="bg-white rounded-2xl border border-line p-4">
                          <div className="flex items-center gap-3 mb-1">
                            <Briefcase size={15} className="text-forest" />
                            <div className="font-semibold text-sm">{itemTitle(item)}</div>
                          </div>
                          <div className="text-xs text-slate mb-1">{itemSummary(item)}</div>
                          {signed && (
                            <div className="text-xs text-ink">
                              {signed.source === "compared" ? "Tecknad hos" : "Auto-hämtad från"} {signed.name} —{" "}
                              {signed.price} kr/mån
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
