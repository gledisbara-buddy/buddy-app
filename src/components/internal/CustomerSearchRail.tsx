"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PillGroup } from "@/components/onboarding/shared";
import { HOUSEHOLD_RELATION_LABELS, type HouseholdRelation } from "@/lib/household";
import { generateHouseholdCode } from "@/lib/household";
import type { InternalCustomerProfile } from "@/components/InternalView";

type ProfileLookup = { id: string; name: string; email: string | null };
type TreeMember = { id: string; name: string; email: string | null; household_relation: HouseholdRelation | null };

type Supabase = ReturnType<typeof createClient>;

// Ett sökfält, tre tolkningar: "@" i texten -> e-post-substräng (som
// tidigare). Rent siffror (10-12 tecken efter att bindestreck strippats)
// -> personnummer, EXAKT match (både med och utan bindestreck provas,
// eftersom fältet är fri text utan normalisering någonstans i appen).
// Exakt match är medvetet — substräng på personnummer gör sökrutan till
// en mild uppräkningsyta för känsliga uppgifter. Annars -> substräng på
// namn eller e-post.
async function searchCustomers(supabase: Supabase, query: string): Promise<ProfileLookup[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (trimmed.includes("@")) {
    const { data } = await supabase.from("customer_profile_view").select("id, name, email").ilike("email", `%${trimmed}%`).limit(10);
    return (data ?? []) as ProfileLookup[];
  }

  const digitsOnly = trimmed.replace(/-/g, "");
  if (/^\d{10,12}$/.test(digitsOnly)) {
    const withDash = `${digitsOnly.slice(0, -4)}-${digitsOnly.slice(-4)}`;
    const { data } = await supabase
      .from("customer_profile_view")
      .select("id, name, email")
      .or(`personnummer.eq.${digitsOnly},personnummer.eq.${withDash}`)
      .limit(10);
    return (data ?? []) as ProfileLookup[];
  }

  const { data } = await supabase
    .from("customer_profile_view")
    .select("id, name, email")
    .or(`name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
    .limit(10);
  return (data ?? []) as ProfileLookup[];
}

export function CustomerSearchRail({
  selectedCustomer,
  onSelectCustomer,
  onHouseholdChanged,
}: {
  selectedCustomer: InternalCustomerProfile | null;
  onSelectCustomer: (id: string) => void;
  onHouseholdChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileLookup[]>([]);
  const [searching, setSearching] = useState(false);

  const [tree, setTree] = useState<TreeMember[]>([]);

  const [addingMember, setAddingMember] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<ProfileLookup[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [linkTarget, setLinkTarget] = useState<ProfileLookup | null>(null);
  const [linkRelation, setLinkRelation] = useState<HouseholdRelation | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    (async () => {
      if (!selectedCustomer) {
        setTree([]);
        return;
      }
      if (!selectedCustomer.household_id) {
        setTree([
          {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            email: selectedCustomer.email,
            household_relation: null,
          },
        ]);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("customer_profile_view")
        .select("id, name, email, household_relation")
        .eq("household_id", selectedCustomer.household_id);
      setTree((data ?? []) as TreeMember[]);
    })();
  }, [selectedCustomer]);

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    const supabase = createClient();
    setResults(await searchCustomers(supabase, query));
    setSearching(false);
  };

  const runAddSearch = async (value: string) => {
    setAddQuery(value);
    if (value.trim().length < 2) {
      setAddResults([]);
      return;
    }
    setAddSearching(true);
    const supabase = createClient();
    const found = await searchCustomers(supabase, value);
    setAddResults(found.filter((p) => p.id !== selectedCustomer?.id && !tree.some((m) => m.id === p.id)));
    setAddSearching(false);
  };

  const confirmLink = async () => {
    if (!selectedCustomer || !linkTarget || !linkRelation) return;
    setLinking(true);
    const supabase = createClient();

    let householdId = selectedCustomer.household_id;
    if (!householdId) {
      const { data, error } = await supabase
        .from("households")
        .insert({ name: "", invite_code: generateHouseholdCode(selectedCustomer.name), created_by: selectedCustomer.id })
        .select("id")
        .single();
      if (error || !data) {
        setLinking(false);
        return;
      }
      householdId = data.id as string;
      await supabase.from("profiles").update({ household_id: householdId }).eq("id", selectedCustomer.id);
    }

    await supabase
      .from("profiles")
      .update({ household_id: householdId, household_relation: linkRelation })
      .eq("id", linkTarget.id);

    setLinking(false);
    setAddingMember(false);
    setAddQuery("");
    setAddResults([]);
    setLinkTarget(null);
    setLinkRelation(null);
    onHouseholdChanged();
  };

  return (
    <div className="w-full md:w-72 flex-none flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Personnummer eller e-post"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-line text-sm"
          />
          <button
            onClick={runSearch}
            className="bd-btn px-3.5 rounded-xl font-semibold text-white bg-forest flex items-center justify-center"
            aria-label="Sök"
          >
            <Search size={15} />
          </button>
        </div>
        {searching && <p className="text-xs text-slate">Söker…</p>}
        {!searching && results.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectCustomer(p.id);
                  setResults([]);
                  setQuery("");
                }}
                className="bg-white rounded-xl border border-line px-3 py-2.5 text-left hover:bg-frost"
              >
                <div className="text-sm font-medium">{p.name || "(Namn saknas)"}</div>
                <div className="text-xs text-slate">{p.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="border-t border-line pt-4">
          <div className="text-xs font-semibold mb-2 text-slate">KUNDTRÄD</div>
          <div className="flex flex-col gap-1.5 mb-3">
            {tree.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectCustomer(m.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left"
                style={
                  m.id === selectedCustomer.id
                    ? { background: "var(--color-frost-2)", border: "1px solid var(--color-forest-light)" }
                    : { border: "1px solid transparent" }
                }
              >
                <span className="text-sm font-medium truncate">{m.name || "(Namn saknas)"}</span>
                <span className="text-xs text-slate flex-none ml-2">
                  {m.id === selectedCustomer.id ? "Öppen" : m.household_relation ? HOUSEHOLD_RELATION_LABELS[m.household_relation] : "–"}
                </span>
              </button>
            ))}
          </div>

          {!addingMember ? (
            <button
              onClick={() => setAddingMember(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-forest"
            >
              <UserPlus size={13} /> Lägg till familjemedlem
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                value={addQuery}
                onChange={(e) => runAddSearch(e.target.value)}
                placeholder="Sök kund att lägga till"
                className="px-3 py-2 rounded-xl border border-line text-sm"
              />
              {addSearching && <p className="text-xs text-slate">Söker…</p>}
              {!linkTarget &&
                addResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setLinkTarget(p)}
                    className="bg-white rounded-xl border border-line px-3 py-2 text-left hover:bg-frost"
                  >
                    <div className="text-sm font-medium">{p.name || "(Namn saknas)"}</div>
                    <div className="text-xs text-slate">{p.email}</div>
                  </button>
                ))}
              {linkTarget && (
                <div className="bg-white rounded-xl border border-line p-3">
                  <div className="text-sm font-medium mb-2">{linkTarget.name || linkTarget.email}</div>
                  <PillGroup
                    options={["partner", "barn", "annan"] as const}
                    labels={HOUSEHOLD_RELATION_LABELS}
                    value={linkRelation}
                    onChange={setLinkRelation}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={confirmLink}
                      disabled={!linkRelation || linking}
                      className="bd-btn flex-1 py-2 rounded-full text-xs font-semibold text-white bg-forest disabled:opacity-40"
                    >
                      {linking ? "Lägger till…" : "Lägg till"}
                    </button>
                    <button
                      onClick={() => setLinkTarget(null)}
                      className="flex-1 py-2 rounded-full text-xs font-semibold text-slate"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setAddingMember(false);
                  setAddQuery("");
                  setAddResults([]);
                  setLinkTarget(null);
                }}
                className="text-xs font-semibold text-slate text-left"
              >
                Stäng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
