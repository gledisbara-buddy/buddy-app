import { Car, Home, Wifi } from "lucide-react";

// Stiliserad, icke-interaktiv vy av instrumentpanelen med påhittat
// exempelinnehåll — inte en skärmdump av ett riktigt konto. Återanvänder
// samma klasser/tokens som Dashboard.tsx:s trygghetspoäng-kort så den
// faktiskt liknar produkten, men innehållet är fritt hittat på (samma
// bolagsnamn som TOP_LIST för att hålla sig inom samma fiktiva värld).
const MOCK_ITEMS = [
  { icon: Home, label: "Hemförsäkring", bolag: "Klarsäker", price: "129 kr/mån" },
  { icon: Car, label: "Bilförsäkring", bolag: "Nordvakt", price: "389 kr/mån" },
  { icon: Wifi, label: "Mobilabonnemang", bolag: "Comviq", price: "199 kr/mån" },
];

export function ProductPreview() {
  return (
    <div className="rounded-[2rem] border border-line bg-white shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-line" style={{ background: "var(--color-frost-90)" }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-line)" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-line)" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-line)" }} />
        </div>
        <div className="flex-1 text-center text-xs font-medium text-slate">minbuddy.se</div>
      </div>

      <div className="p-5 md:p-6">
        <div className="bd-eyebrow mb-1">Din översikt</div>
        <div className="bd-display text-xl mb-5">Hej Sam 👋</div>

        <div className="rounded-2xl border border-line p-4 mb-5 bg-white">
          <div className="flex items-center gap-4">
            <div className="bd-display text-2xl text-ink flex-none">86</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink mb-1.5">Trygghetspoäng</div>
              <div className="h-1.5 rounded-full overflow-hidden bg-frost-2">
                <div className="h-full rounded-full bg-forest" style={{ width: "86%" }} />
              </div>
              <div className="text-xs mt-1.5 text-slate">4 av 5 avtal jämförda</div>
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold mb-2 text-slate">DINA SAKER</div>
        <div className="flex flex-col gap-2">
          {MOCK_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-line p-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                <item.icon size={16} className="text-forest" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-xs text-slate">{item.bolag}</div>
              </div>
              <div className="text-xs font-medium text-forest flex-none">{item.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
