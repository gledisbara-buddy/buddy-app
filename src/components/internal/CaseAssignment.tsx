"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EmployeeDirectoryRow = { email: string; name: string | null };

// Tilldelnings-/ta över-väljare, delad mellan RequestsInbox.tsx (globala
// inkorgen) och CustomerCasesTab.tsx (kund-specifika vyn). Backdrop
// istället för onBlur för att stänga — onBlur visade sig opålitligt för
// den här sortens dropdown tidigare i internverktyget (se TabBar.tsx).
export function CaseAssignment({
  assignedTo,
  myEmail,
  onAssign,
}: {
  assignedTo: string | null;
  myEmail: string;
  onAssign: (email: string | null) => void;
}) {
  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    createClient()
      .from("employee_directory")
      .select("email, name")
      .then(({ data }) => setEmployees((data ?? []) as EmployeeDirectoryRow[]));
  }, []);

  const assignedLabel =
    assignedTo === myEmail ? "Dig" : employees.find((e) => e.email === assignedTo)?.name || assignedTo || null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-line"
      >
        <Users size={13} className={assignedTo ? "text-forest" : "text-slate"} />
        {assignedTo ? `Tilldelad: ${assignedLabel}` : "Otilldelad"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-56 bg-white rounded-xl border border-line shadow-lg p-1 max-h-60 overflow-y-auto">
            {assignedTo !== myEmail && (
              <button
                onClick={() => {
                  onAssign(myEmail);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-forest hover:bg-frost"
              >
                Ta över (tilldela mig)
              </button>
            )}
            <button
              onClick={() => {
                onAssign(null);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-frost"
            >
              Otilldelad
            </button>
            <div className="h-px my-1 bg-line" />
            {employees.map((e) => (
              <button
                key={e.email}
                onClick={() => {
                  onAssign(e.email);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-frost"
              >
                {e.email === myEmail ? "Dig" : e.name || e.email}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
