"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PiggyBank, ShieldCheck, Sparkles, Users } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";
import { createClient } from "@/lib/supabase/client";
import { buildTodoList } from "@/lib/todo";
import { computeTrustScore } from "@/lib/trust-score";
import { ITEM_GROUPS, type InsuranceItem } from "@/lib/items";
import { effectiveQuote, type Quote } from "@/lib/quote";

type HistoryRow = { item_id: string; data: Quote; created_at: string };

function monthlyPriceOf(item: InsuranceItem, quote?: Quote): number {
  if (quote?.price) return quote.price;
  if (item.kind === "telekom" || item.kind === "prenumeration") return item.prisPerManad;
  if (item.kind === "kreditkort" && item.harReddan && item.arsavgift) return Math.round(item.arsavgift / 12);
  return 0;
}

// Går igenom hela historiken (policy_history, se schema.sql) och jämför
// första och senaste noterade priset per sak — precis samma jämförelse som
// spara-sammanfattningsmejlet gör direkt vid tecknandet (se CompareFlow.tsx),
// bara retroaktivt över allt som skett hittills. Historiken börjar tom när
// tabellen skapades, så den här summan växer i takt med att kunden faktiskt
// jämför — ingen bakåtfyllning eller påhittade siffror.
function computeMonthlySavings(history: HistoryRow[]): number {
  const byItem = new Map<string, HistoryRow[]>();
  for (const row of history) {
    if (!byItem.has(row.item_id)) byItem.set(row.item_id, []);
    byItem.get(row.item_id)!.push(row);
  }
  let total = 0;
  for (const rows of byItem.values()) {
    if (rows.length < 2) continue;
    const from = rows[0].data.price;
    const to = rows[rows.length - 1].data.price;
    if (to < from) total += from - to;
  }
  return total;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

export function AnnualReportView() {
  const router = useRouter();
  const { userType, loading, userId, profile, items, policies, missingInsuranceRequests, householdRequests, household } = useBuddy();
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("policy_history")
      .select("item_id, data, created_at")
      .order("created_at", { ascending: true })
      .then(({ data }) => setHistory((data ?? []) as HistoryRow[]));
  }, [userId]);

  useEffect(() => {
    if (!household) return;
    const supabase = createClient();
    supabase
      .rpc("get_household_summary")
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { member_count: number } | null;
        if (row) setMemberCount(row.member_count);
      });
  }, [household]);

  if (loading || !userType || history === null) return null;

  // Samma härledning som Dashboard.tsx: registrerat telefonnummer utan en
  // riktig mobilpost räknas som en ofullständig sak för Att göra-listan.
  const pendingMobilNumber =
    profile?.phone && !items.some((i) => i.kind === "telekom" && i.typ === "mobil") ? profile.phone : null;
  const todoList = buildTodoList({ items, policies, profile, missingInsuranceRequests, pendingMobilNumber, householdRequests });
  const hasUrgentRenewal = todoList.some((row) => row.id.startsWith("renewal-") && row.urgent);
  const trustScore = computeTrustScore({ items, policies, profile, hasUrgentRenewal });

  const monthlyCost = items.reduce((sum, item) => {
    const quote = policies[item.id];
    return sum + monthlyPriceOf(item, quote ? effectiveQuote(quote) : undefined);
  }, 0);
  const monthlySavings = computeMonthlySavings(history);

  const groupCounts = ITEM_GROUPS.map((g) => ({ label: g.label, count: items.filter(g.matchesItem).length })).filter((g) => g.count > 0);

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} />
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Din årsrapport</span>
        <h1 className="bd-display text-3xl mt-2 mb-1">Din resa med Buddy</h1>
        <p className="text-sm mb-8 text-slate">
          {profile?.memberSince ? `Sedan ${formatDate(profile.memberSince)}` : "En sammanfattning av läget just nu"}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl border border-line p-6 bg-white">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-frost-2">
              <PiggyBank size={16} className="text-forest" />
            </div>
            <div className="text-xs font-semibold mb-1 text-slate">DU SPARAR</div>
            {monthlySavings > 0 ? (
              <>
                <div className="bd-display text-4xl text-ink" style={{ fontVariantNumeric: "proportional-nums" }}>
                  {monthlySavings} kr
                </div>
                <div className="text-xs text-slate mt-1">per månad · {monthlySavings * 12} kr per år</div>
              </>
            ) : (
              <p className="text-sm text-slate mt-1">
                Inga besparingar registrerade ännu. Jämför en av dina saker för att se den här.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-line p-6 bg-white">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-frost-2">
              <ShieldCheck size={16} className="text-forest" />
            </div>
            <div className="text-xs font-semibold mb-1 text-slate">TRYGGHETSPOÄNG NU</div>
            {trustScore ? (
              <>
                <div className="bd-display text-4xl text-ink" style={{ fontVariantNumeric: "proportional-nums" }}>
                  {trustScore.score}
                </div>
                <div className="text-xs text-slate mt-1">
                  {trustScore.comparedCount} av {trustScore.comparableCount} avtal jämförda
                </div>
              </>
            ) : (
              <p className="text-sm text-slate mt-1">Lägg till en sak för att få ett trygghetspoäng.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line p-6 mb-4 bg-white">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="text-xs font-semibold mb-1 text-slate">NUVARANDE MÅNADSKOSTNAD</div>
              <div className="bd-display text-3xl text-ink" style={{ fontVariantNumeric: "proportional-nums" }}>
                {monthlyCost} kr/mån
              </div>
            </div>
            {memberCount != null && memberCount > 1 && (
              <div className="flex items-center gap-2 text-sm text-slate">
                <Users size={15} className="text-forest" /> {memberCount} personer i hushållet
              </div>
            )}
          </div>
          {groupCounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {groupCounts.map((g) => (
                <span key={g.label} className="text-xs font-medium px-2.5 py-1 rounded-full bg-frost-2 text-forest">
                  {g.count} {g.label.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate flex items-center gap-1.5">
          <Sparkles size={13} className="text-forest" /> Rapporten byggs på det som faktiskt hänt i ditt konto — den växer i takt med att du använder Buddy.
        </p>
      </div>
    </div>
  );
}
