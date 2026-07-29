import Link from "next/link";
import { Building2, ChevronRight, User } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function KomIgangPage() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-center px-6 py-6">
        <Logo />
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md bd-fade">
          <div className="text-center mb-8">
            <span className="bd-eyebrow">Kom igång</span>
            <h1 className="bd-display text-3xl mt-3 mb-2">Vem loggar in idag?</h1>
            <p className="text-sm text-slate">
              Vi anpassar frågorna beroende på om du är privatperson eller företräder ett
              företag.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/login?type=privat"
              className="bd-card w-full text-left p-5 rounded-2xl border border-line bg-white flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                <User size={20} className="text-forest" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[15px]">Privatperson</div>
                <div className="text-sm text-slate">Boende, fordon, person eller djur</div>
              </div>
              <ChevronRight size={18} className="text-slate" />
            </Link>
            <Link
              href="/login?type=foretag"
              className="bd-card w-full text-left p-5 rounded-2xl border border-line bg-white flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                <Building2 size={20} className="text-forest" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[15px]">Företag</div>
                <div className="text-sm text-slate">
                  Företagsförsäkring och dedikerad rådgivare
                </div>
              </div>
              <ChevronRight size={18} className="text-slate" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
