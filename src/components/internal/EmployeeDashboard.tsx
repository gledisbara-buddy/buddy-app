"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  ClipboardList,
  ShieldAlert,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ClaimStatus } from "@/lib/claim";

type BookingRow = {
  id: string;
  user_id: string;
  meeting_type: "video" | "phone";
  day: string;
  time: string;
  status: "ny" | "hanterad" | "avbokad";
  created_at: string;
};

type ClaimRow = {
  id: string;
  user_id: string;
  skadetyp: string | null;
  status: ClaimStatus;
  created_at: string;
};

type ProfileLookup = { id: string; name: string };

type EmployeeDirectoryRow = {
  email: string;
  name: string | null;
  title: string | null;
  department: string | null;
  status: "aktiv" | "ledig" | "sjuk" | "avslutad";
  avatar_path: string | null;
};

type OpenItem = {
  kind: "booking" | "claim";
  id: string;
  userId: string;
  createdAt: string;
  label: string;
  isFresh: boolean;
};

const STATUS_DOT: Record<EmployeeDirectoryRow["status"], string> = {
  aktiv: "bg-forest",
  ledig: "bg-amber-deep",
  sjuk: "bg-amber-deep",
  avslutad: "bg-slate",
};
const STATUS_LABEL: Record<EmployeeDirectoryRow["status"], string> = {
  aktiv: "Aktiv",
  ledig: "Ledig",
  sjuk: "Sjuk",
  avslutad: "Avslutad",
};

function ageDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function ageBadge(iso: string): { label: string; className: string } {
  const days = ageDays(iso);
  if (days < 1) return { label: "Nytt", className: "text-forest bg-frost-2" };
  if (days < 3) return { label: `${days}d gammalt`, className: "text-amber-deep bg-frost-2" };
  return { label: `${days}d — brådskande`, className: "text-red-600 bg-red-50" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

const QUICK_LINKS: { tab: "forfragningar" | "uppsagningar" | "saknade" | "radering" | "kundsok"; label: string }[] = [
  { tab: "forfragningar", label: "Förfrågningar" },
  { tab: "kundsok", label: "Kundsök" },
  { tab: "saknade", label: "Saknade försäkringar" },
  { tab: "radering", label: "Kontoradering" },
];

export function EmployeeDashboard({
  email,
  onOpenCustomer,
  onNavigateTab,
}: {
  email: string;
  onOpenCustomer: (id: string) => void;
  onNavigateTab: (tab: (typeof QUICK_LINKS)[number]["tab"]) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<OpenItem[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLookup>>({});
  const [teammates, setTeammates] = useState<EmployeeDirectoryRow[]>([]);
  const [myActivityCount, setMyActivityCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const todayIso = new Date().toISOString().slice(0, 10);
      const sevenDaysAgoIso = new Date(Date.now() - 7 * 86_400_000).toISOString();

      const [{ data: bookingRows }, { data: claimRows }, { data: directoryRows }, { count: activityCount }] =
        await Promise.all([
          supabase.from("bookings").select("id, user_id, meeting_type, day, time, status, created_at"),
          supabase.from("claims").select("id, user_id, skadetyp, status, created_at"),
          supabase.from("employee_directory").select("*"),
          supabase
            .from("activity_log")
            .select("id", { count: "exact", head: true })
            .eq("actor_email", email)
            .gte("created_at", sevenDaysAgoIso),
        ]);

      const bRows = (bookingRows ?? []) as BookingRow[];
      const cRows = (claimRows ?? []) as ClaimRow[];

      const open: OpenItem[] = [
        ...bRows
          .filter((b) => b.status === "ny")
          .map((b) => ({ kind: "booking" as const, id: b.id, userId: b.user_id, createdAt: b.created_at, label: "Boka specialist", isFresh: true })),
        ...cRows
          .filter((c) => c.status === "mottagen" || c.status === "under_utredning")
          .map((c) => ({
            kind: "claim" as const,
            id: c.id,
            userId: c.user_id,
            createdAt: c.created_at,
            label: `Skadeanmälan${c.skadetyp ? ` — ${c.skadetyp}` : ""}`,
            isFresh: c.status === "mottagen",
          })),
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setOpenItems(open);

      setUpcomingBookings(
        bRows.filter((b) => b.status !== "avbokad" && b.day >= todayIso).sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time))
      );

      const teammateRows = ((directoryRows ?? []) as EmployeeDirectoryRow[]).filter((t) => t.email !== email);
      setTeammates(teammateRows);
      setMyActivityCount(activityCount ?? 0);

      const userIds = Array.from(new Set(open.map((o) => o.userId)));
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase.from("profiles").select("id, name").in("id", userIds);
        setProfilesById(Object.fromEntries(((profileRows ?? []) as ProfileLookup[]).map((p) => [p.id, p])));
      }

      setLoading(false);
    })();
  }, [email]);

  if (loading) return <p className="text-sm text-slate">Laddar…</p>;

  const freshCount = openItems.filter((o) => o.isFresh).length;
  const urgentCount = openItems.filter((o) => ageDays(o.createdAt) >= 3).length;

  return (
    <div className="flex flex-col gap-4">
      {urgentCount > 0 && (
        <div className="rounded-2xl border border-line p-4 flex items-center gap-3 bg-red-50">
          <AlertTriangle size={18} className="text-red-600 flex-none" />
          <p className="text-sm text-ink">
            <span className="font-semibold">{urgentCount} ärende{urgentCount > 1 ? "n" : ""}</span> har legat öppet i
            3+ dagar utan att bli klart.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-line p-5">
          <div className="text-xs text-slate uppercase tracking-wide mb-1">Nya kundärenden</div>
          <div className="bd-display text-3xl">{freshCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5">
          <div className="text-xs text-slate uppercase tracking-wide mb-1">Väntar på svar totalt</div>
          <div className="bd-display text-3xl">{openItems.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5">
          <div className="text-xs text-slate uppercase tracking-wide mb-1">Dina ändringar, 7 dagar</div>
          <div className="bd-display text-3xl">{myActivityCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={16} className="text-forest" />
          <div className="text-sm font-semibold">Prioriterade ärenden</div>
        </div>
        {openItems.length === 0 ? (
          <p className="text-sm text-slate">Inga öppna ärenden — allt är hanterat.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {openItems.slice(0, 6).map((item) => {
              const badge = ageBadge(item.createdAt);
              const requester = profilesById[item.userId];
              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  onClick={() => onOpenCustomer(item.userId)}
                  className="flex items-center gap-3 rounded-xl border border-line p-3 text-left hover:bg-frost"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                    {item.kind === "booking" ? (
                      <Calendar size={15} className="text-forest" />
                    ) : (
                      <ShieldAlert size={15} className="text-forest" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    <div className="text-xs text-slate truncate">{requester?.name ?? "Okänd kund"}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-none ${badge.className}`}>{badge.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-forest" />
          <div className="text-sm font-semibold">Bokade möten</div>
        </div>
        {upcomingBookings.length === 0 ? (
          <p className="text-sm text-slate">Inga kommande möten just nu.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingBookings.slice(0, 5).map((b) => (
              <button
                key={b.id}
                onClick={() => onOpenCustomer(b.user_id)}
                className="flex items-center gap-3 rounded-xl border border-line p-3 text-left hover:bg-frost"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                  <Calendar size={15} className="text-forest" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {b.meeting_type === "video" ? "Videosamtal" : "Telefonsamtal"} — {profilesById[b.user_id]?.name ?? "Okänd kund"}
                  </div>
                  <div className="text-xs text-slate">
                    {formatDate(b.day)} kl. {b.time}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-forest" />
          <div className="text-sm font-semibold">Teamets status</div>
        </div>
        {teammates.length === 0 ? (
          <p className="text-sm text-slate">Inga andra anställda registrerade än.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {teammates.map((t) => (
              <div key={t.email} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-none bg-frost-2">
                  <UserRound size={14} className="text-forest" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.name || t.email}</div>
                  {t.title && <div className="text-xs text-slate truncate">{t.title}</div>}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-slate flex-none">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status]}`} />
                  {STATUS_LABEL[t.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-forest" />
          <div className="text-sm font-semibold">Snabblänkar</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.tab}
              onClick={() => onNavigateTab(link.tab)}
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full border border-line hover:bg-frost"
            >
              {link.label} <ArrowRight size={13} className="text-slate" />
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate">
        &quot;Väntar på svar&quot;, &quot;Prioriterade ärenden&quot; och tidsmärkningen ovan är baserade på hur länge
        ett ärende legat öppet — inte ett formellt SLA-mål. Statistiken över egna ändringar räknas från
        aktivitetsloggen, inte från tilldelade ärenden (inget ägarskap finns ännu).
      </p>
    </div>
  );
}
