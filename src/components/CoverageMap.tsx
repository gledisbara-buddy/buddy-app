"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { COVERAGE_LABELS, coverageFor, REGION_LABELS, regionForLatLon, type CoverageLevel } from "@/lib/coverage";
import type { Elomrade } from "@/lib/items";

type AddressResult = { adress: string; postnummer: string; ort: string; lat?: number; lon?: number };

const COVERAGE_COLOR: Record<CoverageLevel, string> = {
  bra: "var(--color-forest)",
  ok: "var(--color-amber, #b7791f)",
  svag: "var(--color-slate)",
};

// Schematisk, inte geografiskt exakt karta — fyra staplade band (SE1 smalast
// högst upp i norr, SE4 bredast längst ner i söder) som tonar bredden likt
// Sveriges avsmalnande form. Se projectToMapXY-kommentaren i coverage.ts:
// samma pragmatiska nivå som resten av prototypens simulerade data.
const BAND_HEIGHT = 40;
const BAND_TOP_WIDTH: Record<Elomrade, [number, number]> = {
  SE1: [28, 45],
  SE2: [22, 55],
  SE3: [18, 70],
  SE4: [12, 100],
};
const REGION_ORDER: Elomrade[] = ["SE1", "SE2", "SE3", "SE4"];

function bandPath(region: Elomrade, index: number): string {
  const [topHalf, bottomHalf] = BAND_TOP_WIDTH[region];
  const yTop = index * BAND_HEIGHT;
  const yBottom = yTop + BAND_HEIGHT;
  const cx = 50;
  return `M ${cx - topHalf / 2} ${yTop} L ${cx + topHalf / 2} ${yTop} L ${cx + bottomHalf / 2} ${yBottom} L ${cx - bottomHalf / 2} ${yBottom} Z`;
}

function markerPosition(lat: number, lon: number, latMin: number, latMax: number, lonMin: number, lonMax: number) {
  const latFrac = Math.max(0, Math.min(1, (lat - latMin) / (latMax - latMin)));
  const y = (1 - latFrac) * (BAND_HEIGHT * REGION_ORDER.length);
  const bandIndex = Math.min(REGION_ORDER.length - 1, Math.floor(y / BAND_HEIGHT));
  const region = REGION_ORDER[bandIndex];
  const yWithinBand = y - bandIndex * BAND_HEIGHT;
  const [topHalf, bottomHalf] = BAND_TOP_WIDTH[region];
  const halfWidthAtY = topHalf + ((bottomHalf - topHalf) * yWithinBand) / BAND_HEIGHT;
  const lonFrac = Math.max(0, Math.min(1, (lon - lonMin) / (lonMax - lonMin)));
  const x = 50 - halfWidthAtY / 2 + lonFrac * halfWidthAtY;
  return { x, y };
}

const SWEDEN_BOUNDS = { latMin: 55.3, latMax: 69.1, lonMin: 10.9, lonMax: 24.2 };

export function CoverageMap({ operatorName, defaultAddress }: { operatorName: string; defaultAddress?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [selected, setSelected] = useState<AddressResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Skyddar mot att en redan pågående sökning (skickad innan kunden hann
  // välja en adress) svarar EFTER pick()/handleQueryChange och fyller
  // dropdownen igen med gamla resultat — samma mönster som lookupToken i
  // TelekomForm.tsx/BilForm.tsx.
  const requestToken = useRef(0);
  // pick() sätter query till den fullständiga "adress, ort"-strängen för
  // att visa den i fältet — men det är fortfarande en query-ändring, så
  // utan den här flaggan skulle effekten nedan trigga en NY sökning på
  // den redan valda adressen och fylla dropdownen igen.
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (query.trim().length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const token = ++requestToken.current;
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/address-search?query=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          if (requestToken.current !== token) return;
          setResults(data.results ?? []);
        })
        .catch(() => {
          if (requestToken.current === token) setResults([]);
        })
        .finally(() => {
          if (requestToken.current === token) setLoading(false);
        });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelected(null);
    if (value.trim().length < 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestToken.current++;
      setResults([]);
    }
  };

  const pick = (r: AddressResult) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestToken.current++;
    skipNextSearch.current = true;
    setSelected(r);
    setQuery(`${r.adress}, ${r.ort}`);
    setResults([]);
  };

  const hasCoords = selected?.lat != null && selected?.lon != null;
  const region = hasCoords ? regionForLatLon(selected!.lat!) : undefined;
  const level = hasCoords ? coverageFor(operatorName, selected!.lat!) : undefined;
  const marker = hasCoords
    ? markerPosition(
        selected!.lat!,
        selected!.lon!,
        SWEDEN_BOUNDS.latMin,
        SWEDEN_BOUNDS.latMax,
        SWEDEN_BOUNDS.lonMin,
        SWEDEN_BOUNDS.lonMax
      )
    : undefined;

  return (
    <div className="bg-white rounded-2xl border border-line p-5">
      <div className="text-sm font-semibold mb-1">Täckningskarta — {operatorName}</div>
      <p className="text-xs mb-3 text-slate">Sök din adress för att se hur bra täckningen är just där.</p>

      <div className="relative mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="T.ex. Kungsgatan 5, Göteborg"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-line text-sm"
          />
        </div>
        {results.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-line shadow-lg overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => pick(r)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-frost border-b border-line last:border-b-0"
              >
                {r.adress}, {r.ort}
              </button>
            ))}
          </div>
        )}
        {defaultAddress && !selected && (
          <button
            onClick={() => setQuery(defaultAddress)}
            className="text-xs font-semibold mt-2 text-forest"
          >
            Använd din sparade adress ({defaultAddress})
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <svg
          viewBox={`0 0 100 ${BAND_HEIGHT * REGION_ORDER.length}`}
          className="w-28 flex-none"
          role="img"
          aria-label="Schematisk täckningskarta över Sverige"
        >
          {REGION_ORDER.map((region_, i) => (
            <path
              key={region_}
              d={bandPath(region_, i)}
              fill={region === region_ ? "var(--color-frost-2)" : "var(--color-frost)"}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
          ))}
          {marker && (
            <circle cx={marker.x} cy={marker.y} r={3.5} fill={level ? COVERAGE_COLOR[level] : "var(--color-ink)"} stroke="white" strokeWidth={1.5} />
          )}
        </svg>
        <div className="flex-1">
          {loading && <div className="text-xs text-slate">Söker adress…</div>}
          {!hasCoords && !loading && (
            <div className="text-xs text-slate">Sök en adress ovan för att se täckningen där.</div>
          )}
          {hasCoords && region && level && (
            <div className="bd-fade">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={14} className="text-forest" />
                <span className="text-sm font-semibold">{COVERAGE_LABELS[level]}</span>
              </div>
              <div className="text-xs text-slate mb-3">{REGION_LABELS[region]}</div>
              <div className="flex flex-col gap-1.5">
                {REGION_ORDER.map((r) => (
                  <div key={r} className="flex items-center justify-between text-xs">
                    <span className={r === region ? "font-semibold text-ink" : "text-slate"}>{REGION_LABELS[r]}</span>
                    <span style={{ color: COVERAGE_COLOR[coverageFor(operatorName, r === "SE1" ? 65 : r === "SE2" ? 63 : r === "SE3" ? 60 : 57)] }}>
                      {COVERAGE_LABELS[coverageFor(operatorName, r === "SE1" ? 65 : r === "SE2" ? 63 : r === "SE3" ? 60 : 57)]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
