"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Camera, Clock, History, KeyRound, ShieldCheck } from "lucide-react";
import { EditableField } from "@/components/internal/EditableField";
import { PasswordField, PillGroup } from "@/components/onboarding/shared";
import { ConfirmDialog } from "@/components/Overlay";
import { createClient } from "@/lib/supabase/client";

type EmployeeStatus = "aktiv" | "ledig" | "sjuk" | "avslutad";

type EmployeeRow = {
  email: string;
  name: string | null;
  avatar_path: string | null;
  title: string | null;
  phone: string | null;
  department: string | null;
  permission_level: string;
  hired_at: string | null;
  status: EmployeeStatus;
  responsibilities: string | null;
  specialties: string | null;
  languages: string | null;
  working_hours: string | null;
  signature: string | null;
  calendar_connected_provider: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<EmployeeStatus, string> = { aktiv: "Aktiv", ledig: "Ledig", sjuk: "Sjuk", avslutad: "Avslutad" };
const SELECTABLE_STATUSES = ["aktiv", "ledig", "sjuk"] as const;

const DEMO_EVENTS = [
  { when: "Idag 10:00–10:30", title: "Teammöte" },
  { when: "Idag 13:00–14:00", title: "Kundsamtal (bokat via Buddy)" },
  { when: "Imorgon 09:00–09:15", title: "Daglig avstämning" },
];

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
}

export function EmployeeProfile({ email, userId }: { email: string; userId: string }) {
  const [row, setRow] = useState<EmployeeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mfaVerifiedAt, setMfaVerifiedAt] = useState<string | null>(null);
  const [confirmResetMfa, setConfirmResetMfa] = useState(false);
  const [resettingMfa, setResettingMfa] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [loginLog, setLoginLog] = useState<{ id: string; logged_in_at: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: empRow }, { data: factors }, { data: logRows }] = await Promise.all([
        supabase.from("employees").select("*").eq("email", email).single(),
        supabase.auth.mfa.listFactors(),
        supabase.from("employee_login_log").select("id, logged_in_at").order("logged_in_at", { ascending: false }).limit(10),
      ]);
      if (empRow) {
        const r = empRow as EmployeeRow;
        setRow(r);
        if (r.avatar_path) {
          const { data } = supabase.storage.from("employee-avatars").getPublicUrl(r.avatar_path);
          setAvatarUrl(data.publicUrl);
        }
      }
      const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
      if (verifiedTotp) setMfaVerifiedAt(verifiedTotp.created_at);
      if (logRows) setLoginLog(logRows as { id: string; logged_in_at: string }[]);
      setLoading(false);
    })();
  }, [email]);

  const saveField = async (field: keyof EmployeeRow, value: unknown): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase.from("employees").update({ [field]: value }).eq("email", email);
    if (error) return false;
    setRow((prev) => (prev ? { ...prev, [field]: value } : prev));
    return true;
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("employee-avatars").upload(path, file, { upsert: true });
    if (!error) {
      const ok = await saveField("avatar_path", path);
      if (ok) {
        const { data } = supabase.storage.from("employee-avatars").getPublicUrl(path);
        setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
      }
    }
    setUploadingAvatar(false);
  };

  const handleResetMfa = async () => {
    setResettingMfa(true);
    const supabase = createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((f) => f.status === "verified");
    if (verified) await supabase.auth.mfa.unenroll({ factorId: verified.id });
    window.location.reload();
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("Lösenordet måste vara minst 6 tecken.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Lösenorden matchar inte.");
      return;
    }
    setPasswordSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError("Kunde inte byta lösenord just nu. Försök igen om en stund.");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  const connectCalendar = () => saveField("calendar_connected_provider", "teams");
  const disconnectCalendar = () => saveField("calendar_connected_provider", null);

  if (loading || !row) return <div className="text-sm text-slate py-10 text-center">Laddar…</div>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="bg-white rounded-2xl border border-line p-5 flex items-center gap-4">
        <div className="relative flex-none">
          <button
            onClick={handleAvatarPick}
            className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-frost-2"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- offentlig storage-url, next/image kan inte optimera det ändå
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="bd-display text-xl text-forest">{(row.name || email)[0]?.toUpperCase()}</span>
            )}
          </button>
          <button
            onClick={handleAvatarPick}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white bg-forest border-2 border-white"
          >
            <Camera size={11} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg truncate">{row.name || email}</div>
          <div className="text-sm text-slate truncate">{row.title || "Ingen titel angiven"}</div>
          <div className="text-xs text-slate truncate">{email}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="text-sm font-semibold mb-3">Status</div>
        {row.status === "avslutad" ? (
          <span className="text-xs px-3 py-1.5 rounded-full bg-frost-2 text-slate">Avslutad</span>
        ) : (
          <PillGroup
            options={SELECTABLE_STATUSES}
            labels={STATUS_LABELS}
            value={row.status as (typeof SELECTABLE_STATUSES)[number]}
            onChange={(v) => saveField("status", v)}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-line p-5 flex flex-col gap-4">
        <div className="text-sm font-semibold">Om dig</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <EditableField label="Titel" value={row.title} placeholder="T.ex. Kundspecialist" onSave={(v) => saveField("title", v || null)} />
          <EditableField
            label="Avdelning / team"
            value={row.department}
            placeholder="T.ex. Kundservice"
            onSave={(v) => saveField("department", v || null)}
          />
          <EditableField
            label="Telefonnummer"
            value={row.phone}
            placeholder="070-123 45 67"
            onSave={(v) => saveField("phone", v || null)}
          />
          <EditableField
            label="Arbetstider"
            value={row.working_hours}
            placeholder="T.ex. Mån–fre 8–17"
            onSave={(v) => saveField("working_hours", v || null)}
          />
        </div>
        <EditableField
          label="Ansvarsområden"
          value={row.responsibilities}
          placeholder="T.ex. Skadereglering, kundtjänst"
          onSave={(v) => saveField("responsibilities", v || null)}
        />
        <EditableField
          label="Specialistområden"
          value={row.specialties}
          placeholder="T.ex. Villaförsäkring, bilförsäkring"
          onSave={(v) => saveField("specialties", v || null)}
        />
        <EditableField label="Språk" value={row.languages} placeholder="T.ex. Svenska, engelska" onSave={(v) => saveField("languages", v || null)} />
        <EditableField
          label="Personlig signatur"
          value={row.signature}
          placeholder="T.ex. Med vänlig hälsning, hela ditt namn"
          onSave={(v) => saveField("signature", v || null)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="text-sm font-semibold mb-4">Anställning</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="text-forest flex-none mt-0.5" />
            <div>
              <div className="text-xs text-slate uppercase tracking-wide mb-0.5">Behörighetsnivå</div>
              <div className="text-sm font-medium capitalize">{row.permission_level}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-forest flex-none mt-0.5" />
            <div>
              <div className="text-xs text-slate uppercase tracking-wide mb-0.5">Anställd sedan</div>
              <div className="text-sm font-medium">{formatDate(row.hired_at) ?? "Ej angivet"}</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate mt-4">Behörighetsnivå och anställningsdatum sätts av en administratör, inte här.</p>
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Kalender</div>
          {row.calendar_connected_provider ? (
            <button onClick={disconnectCalendar} className="text-xs font-semibold text-slate hover:text-ink">
              Koppla från
            </button>
          ) : (
            <button onClick={connectCalendar} className="text-xs font-semibold text-forest">
              Anslut Microsoft Teams-kalender
            </button>
          )}
        </div>
        {row.calendar_connected_provider ? (
          <div className="flex flex-col gap-2">
            {DEMO_EVENTS.map((ev) => (
              <div key={ev.title} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <Clock size={14} className="text-forest flex-none" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{ev.title}</div>
                  <div className="text-xs text-slate">{ev.when}</div>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate mt-1">Demo — visar exempelmöten, ingen riktig kalender är kopplad i prototypen.</p>
          </div>
        ) : (
          <p className="text-sm text-slate">Koppla din Teams- eller Outlook-kalender för att se din vecka här.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-forest" />
          <div className="text-sm font-semibold">Byt lösenord</div>
        </div>
        <PasswordField label="Nytt lösenord" value={newPassword} onChange={setNewPassword} placeholder="Minst 6 tecken" />
        <PasswordField label="Bekräfta nytt lösenord" value={confirmPassword} onChange={setConfirmPassword} placeholder="Upprepa lösenordet" />
        {passwordError && <p className="text-sm text-red-600 mb-3">{passwordError}</p>}
        <button
          onClick={handlePasswordChange}
          disabled={!newPassword || !confirmPassword || passwordSaving}
          className="bd-btn px-5 py-2.5 rounded-full font-semibold text-white text-sm bg-forest disabled:opacity-50"
        >
          {passwordSaved ? "Lösenordet bytt" : passwordSaving ? "Byter…" : "Byt lösenord"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-forest" />
            <div className="text-sm font-semibold">Tvåfaktorsautentisering</div>
          </div>
          <span className="text-xs flex items-center gap-1 text-forest">Aktiverad</span>
        </div>
        <p className="text-xs text-slate mb-3">
          {mfaVerifiedAt ? `Aktiverad ${formatDate(mfaVerifiedAt)}.` : "Aktiverad."} Krävs varje gång du loggar in i
          internverktyget.
        </p>
        <button onClick={() => setConfirmResetMfa(true)} className="text-xs font-semibold text-red-600">
          Nollställ och registrera om
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-line p-5">
        <div className="flex items-center gap-2 mb-3">
          <History size={16} className="text-forest" />
          <div className="text-sm font-semibold">Inloggningshistorik</div>
        </div>
        {loginLog.length === 0 ? (
          <p className="text-sm text-slate">Inga tidigare inloggningar registrerade än.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {loginLog.map((l) => (
              <div key={l.id} className="text-sm text-slate">
                {formatDateTime(l.logged_in_at)}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmResetMfa && (
        <ConfirmDialog
          title="Nollställ tvåfaktorsautentisering?"
          body="Du loggas inte ut, men måste registrera en ny autentiseringsapp direkt igen för att komma åt internverktyget."
          confirmLabel={resettingMfa ? "Nollställer…" : "Nollställ"}
          onConfirm={handleResetMfa}
          onCancel={() => setConfirmResetMfa(false)}
        />
      )}
    </div>
  );
}
