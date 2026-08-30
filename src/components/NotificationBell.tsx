"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useBuddy } from "@/lib/buddy-context";
import { buildTodoList } from "@/lib/todo";

// Samma klocka som ProfileMenu.tsx:s gamla dropdown-mönster (absolut
// positionerad vit kort-panel), fast med Att göra-listan istället för
// navigering — så att brådskande saker syns på VILKEN sida som helst med
// flikraden, inte bara på Översikten.
export function NotificationBell() {
  const router = useRouter();
  const { items, policies, profile, missingInsuranceRequests, householdRequests } = useBuddy();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const pendingMobilNumber =
    profile?.phone && !items.some((i) => i.kind === "telekom" && i.typ === "mobil") ? profile.phone : null;
  const todoList = buildTodoList({ items, policies, profile, missingInsuranceRequests, pendingMobilNumber, householdRequests });
  const urgentCount = todoList.filter((t) => t.urgent).length;

  // mousedown-utanför istället för onBlur — se TabBar.tsx:s Mer-knapp för
  // samma fix och varför (onBlur kunde stänga panelen direkt vid
  // öppningsklicket i vissa webbläsare). Escape-stängning matchar samma
  // Mer-panel och Overlay.tsx.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (todoList.length === 0) return null;

  const go = (href?: string) => {
    setOpen(false);
    if (href) router.push(href);
  };

  return (
    <div className="relative flex-none" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-frost-2"
        aria-label="Notiser"
      >
        <Bell size={18} className="text-ink" />
        <span
          className={`absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
            urgentCount > 0 ? "bg-amber-deep" : "bg-forest"
          }`}
        >
          {todoList.length}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-line shadow-lg overflow-hidden z-20 bd-fade">
          <div className="px-4 py-3 border-b border-line text-sm font-semibold">Att göra</div>
          <div className="divide-y divide-line max-h-80 overflow-y-auto">
            {todoList.map((row) => {
              const Icon = row.icon;
              const content = (
                <>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                    <Icon size={15} className="text-forest" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-snug">{row.label}</div>
                    {row.sublabel && (
                      <div className={`text-xs font-semibold mt-0.5 ${row.urgent ? "text-amber-deep" : "text-slate"}`}>
                        {row.sublabel}
                      </div>
                    )}
                  </div>
                </>
              );
              return row.href ? (
                <button
                  key={row.id}
                  onClick={() => go(row.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-frost"
                >
                  {content}
                </button>
              ) : (
                <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
