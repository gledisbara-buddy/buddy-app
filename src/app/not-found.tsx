import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-center px-6 py-6">
        <Logo />
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md text-center bd-fade">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-frost-2 mx-auto mb-5">
            <Search size={26} className="text-forest" />
          </div>
          <span className="bd-eyebrow">404</span>
          <h1 className="bd-display text-3xl mt-3 mb-2">Vi hittar inte den sidan</h1>
          <p className="text-sm mb-8 text-slate">
            Länken kan vara felstavad eller inte finnas längre. Prova startsidan eller något av
            det vi jämför.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="bd-btn px-6 py-3 rounded-full font-semibold text-white text-sm bg-forest inline-flex items-center justify-center gap-2"
            >
              Till startsidan <ArrowRight size={15} />
            </Link>
            <Link
              href="/jamfor"
              className="bd-btn px-6 py-3 rounded-full font-semibold text-sm border border-line bg-white inline-flex items-center justify-center gap-2"
            >
              Se allt vi jämför
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
