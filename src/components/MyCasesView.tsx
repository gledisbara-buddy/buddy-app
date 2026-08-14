"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Phone, ShieldAlert, Video } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy, type BookingRecord, type ClaimRecord } from "@/lib/buddy-context";
import { FIXED_TOPICS, formatBookingDay } from "@/lib/booking";
import { itemTitle } from "@/lib/items";

function StatusPill({ status }: { status: "ny" | "hanterad" }) {
  return (
    <span className={`text-xs font-semibold flex-none ${status === "ny" ? "text-amber-deep" : "text-forest"}`}>
      {status === "ny" ? "● Ny" : "● Hanterad"}
    </span>
  );
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

export function MyCasesView() {
  const router = useRouter();
  const { userType, loading, items, bookings, claims } = useBuddy();

  useEffect(() => {
    if (!loading && !userType) router.replace("/kom-igang");
  }, [loading, userType, router]);

  if (loading || !userType) return null;

  const topicLabel = (id: string) => {
    const fixed = FIXED_TOPICS.find((f) => f.id === id);
    if (fixed) return fixed.label;
    const item = items.find((i) => i.id === id);
    return item ? itemTitle(item) : id;
  };

  const sortedBookings: BookingRecord[] = [...bookings].sort((a, b) =>
    a.day === b.day ? a.time.localeCompare(b.time) : a.day.localeCompare(b.day)
  );
  const sortedClaims: ClaimRecord[] = [...claims].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen w-full">
      <TopBar onBack={() => router.push("/dashboard")} right={<ProfileMenu />} showTabs />
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-10 bd-fade">
        <span className="bd-eyebrow">Mina ärenden</span>
        <h1 className="bd-display text-3xl mt-2 mb-1">Dina bokningar & anmälningar</h1>
        <p className="text-sm mb-8 text-slate">Allt du bokat eller anmält hos Buddy, på ett ställe.</p>

        <div className="mb-10">
          <div className="text-sm font-semibold mb-3 text-slate">Bokade möten</div>
          {sortedBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-line p-5 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-slate">Inga bokade möten än.</p>
              <button onClick={() => router.push("/book")} className="text-sm font-semibold text-forest">
                Boka en specialist →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedBookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-line p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                        {b.meetingType === "video" ? (
                          <Video size={16} className="text-forest" />
                        ) : (
                          <Phone size={16} className="text-forest" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {b.meetingType === "video" ? "Videosamtal" : "Telefonsamtal"}
                        </div>
                        <div className="text-xs text-slate">
                          {formatBookingDay(b.day)} kl. {b.time}
                        </div>
                      </div>
                    </div>
                    <StatusPill status={b.status} />
                  </div>
                  {(b.topics.length > 0 || b.extraNote) && (
                    <div className="text-sm text-slate">
                      {b.topics.length > 0 && <div>Gäller: {b.topics.map(topicLabel).join(", ")}</div>}
                      {b.extraNote && <div>{`"${b.extraNote}"`}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold mb-3 text-slate">Skadeanmälningar</div>
          {sortedClaims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-line p-5 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-slate">Inga skadeanmälningar än.</p>
              <button onClick={() => router.push("/claim")} className="text-sm font-semibold text-forest">
                Anmäl en skada →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedClaims.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-line p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                        <ShieldAlert size={16} className="text-forest" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{c.skadetyp ?? "Skadeanmälan"}</div>
                        <div className="text-xs text-slate">{formatCreatedAt(c.createdAt)}</div>
                      </div>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                  <div className="text-sm text-slate">
                    {c.allvarlighetsgrad && <span>Allvarlighetsgrad: {c.allvarlighetsgrad} · </span>}
                    {c.photoCount} foto, {c.receiptCount} kvitton
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line p-5 mt-8 flex items-start gap-3 bg-frost-2">
          <CalendarPlus size={16} className="mt-0.5 flex-none text-amber-deep" />
          <p className="text-xs text-ink">
            Ny-status betyder att Buddy tagit emot ditt ärende. Hanterad betyder att en rådgivare gått igenom det.
          </p>
        </div>
      </div>
    </div>
  );
}
