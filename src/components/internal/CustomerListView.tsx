"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CustomerSegment, CustomerStatus } from "@/components/InternalView";

type Row = {
  id: string;
  name: string;
  email: string | null;
  customer_status: CustomerStatus;
  segment: CustomerSegment | null;
  tags: string[];
  created_at: string;
};

const STATUS_OPTIONS: { value: CustomerStatus | "alla"; label: string }[] = [
  { value: "alla", label: "Alla statusar" },
  { value: "aktiv", label: "Aktiv" },
  { value: "vilande", label: "Vilande" },
  { value: "avslutad", label: "Avslutad" },
];
const SEGMENT_OPTIONS: { value: CustomerSegment | "alla"; label: string }[] = [
  { value: "alla", label: "Alla segment" },
  { value: "ny", label: "Ny kund" },
  { value: "etablerad", label: "Etablerad" },
  { value: "vip", label: "VIP" },
  { value: "risk", label: "Uppsägningsrisk" },
];

const STATUS_DOT: Record<CustomerStatus, string> = { aktiv: "bg-forest", vilande: "bg-amber-deep", avslutad: "bg-slate" };
const PAGE_SIZE = 20;

// Bläddringsbar, filtrerbar kundlista — visas i Kundsök-fliken när ingen
// kund är vald. Sök-en-åt-gången (CustomerSearchRail.tsx) täcker "jag vet
// vem jag letar efter"; den här täcker "visa mig alla VIP-kunder" osv.
export function CustomerListView({ onSelectCustomer }: { onSelectCustomer: (id: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "alla">("alla");
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | "alla">("alla");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Nollställ sidan till 0 när ett filter ändras, under rendering (inte i
  // en effekt) — samma "syncedX"-mönster som CustomerWorkspace.tsx redan
  // använder för att synka om state när kunden byts.
  const [syncedFilters, setSyncedFilters] = useState({ statusFilter, segmentFilter, tagFilter });
  if (
    syncedFilters.statusFilter !== statusFilter ||
    syncedFilters.segmentFilter !== segmentFilter ||
    syncedFilters.tagFilter !== tagFilter
  ) {
    setSyncedFilters({ statusFilter, segmentFilter, tagFilter });
    if (page !== 0) setPage(0);
  }

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setLoading(true);
      let query = supabase
        .from("customer_profile_view")
        .select("id, name, email, customer_status, segment, tags, created_at")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

      if (statusFilter !== "alla") query = query.eq("customer_status", statusFilter);
      if (segmentFilter !== "alla") query = query.eq("segment", segmentFilter);
      if (tagFilter.trim()) query = query.contains("tags", [tagFilter.trim()]);

      const { data } = await query;
      const rowsWithExtra = (data ?? []) as Row[];
      setHasMore(rowsWithExtra.length > PAGE_SIZE);
      setRows(rowsWithExtra.slice(0, PAGE_SIZE));
      setLoading(false);
    })();
  }, [statusFilter, segmentFilter, tagFilter, page]);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | "alla")}
          className="px-3 py-2 rounded-xl border border-line text-sm bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value as CustomerSegment | "alla")}
          className="px-3 py-2 rounded-xl border border-line text-sm bg-white"
        >
          {SEGMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="Filtrera på tagg…"
          className="px-3 py-2 rounded-xl border border-line text-sm flex-1 min-w-[160px]"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate">Laddar…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate">Inga kunder matchar filtret.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectCustomer(r.id)}
              className="bg-white rounded-2xl border border-line p-4 flex items-center gap-3 text-left hover:bg-frost"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-none text-white font-semibold bd-display bg-forest">
                {(r.name || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name || "(Namn saknas)"}</div>
                <div className="text-xs text-slate truncate">{r.email}</div>
              </div>
              {r.segment && (
                <span className="text-xs font-medium px-2 py-1 rounded-full flex-none bg-frost-2 text-forest">
                  {SEGMENT_OPTIONS.find((o) => o.value === r.segment)?.label ?? r.segment}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate flex-none">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.customer_status]}`} />
                {STATUS_OPTIONS.find((o) => o.value === r.customer_status)?.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {(page > 0 || hasMore) && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm font-semibold text-forest disabled:opacity-40"
          >
            <ChevronLeft size={15} /> Föregående
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="flex items-center gap-1 text-sm font-semibold text-forest disabled:opacity-40"
          >
            Nästa <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
