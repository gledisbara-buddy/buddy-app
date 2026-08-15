"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Smartphone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FullmaktSigning } from "@/components/FullmaktSigning";
import { MissingInsuranceFlagger } from "@/components/onboarding/MissingInsuranceFlagger";
import { itemSummary, itemTitle, type ComparableItem } from "@/lib/items";
import { fetchMultiplePolicies } from "@/lib/policy-fetch";
import type { Quote } from "@/lib/quote";
import { useBuddy } from "@/lib/buddy-context";

type Phase = "idle" | "waiting" | "fetching" | "result" | "flag-missing" | "fullmakt";

export function BankIdImport() {
  const router = useRouter();
  const { addItems, setPolicy } = useBuddy();
  const [phase, setPhase] = useState<Phase>("idle");
  const [found, setFound] = useState<{ item: ComparableItem; quote: Quote }[]>([]);

  const finish = () => router.push("/dashboard?imported=1");

  const startBankId = () => {
    setPhase("waiting");
    setTimeout(() => {
      setPhase("fetching");
      fetchMultiplePolicies().then((data) => {
        setFound(data);
        setPhase("result");
      });
    }, 1800);
  };

  const addAllAndContinue = async () => {
    // items måste committas innan policies sätts — policies.item_id har en
    // foreign key mot items.id, se addItems i buddy-context.tsx.
    await addItems(found.map((f) => f.item));
    found.forEach((f) => setPolicy(f.item.id, f.quote));
    setPhase("flag-missing");
  };

  if (phase === "idle") {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-center px-6 py-5">
          <Logo />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 pb-16">
          <div className="w-full max-w-md text-center bd-fade">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-forest mx-auto mb-5">
              <Smartphone size={26} color="white" />
            </div>
            <h1 className="bd-display text-2xl mb-2">Importera dina försäkringar</h1>
            <p className="text-sm mb-6 text-slate">
              Identifiera dig med BankID så hämtar vi de försäkringar du redan har och lägger in dem åt dig.
            </p>
            <button
              onClick={startBankId}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest mb-3"
            >
              <Smartphone size={17} /> Starta Mobilt BankID
            </button>
            <p className="text-xs mb-6 text-slate">Simulerad identifiering i den här prototypen.</p>
            <button onClick={() => router.push("/dashboard")} className="w-full text-sm font-semibold py-2 text-slate">
              Hoppa över, jag lägger in manuellt senare
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-center px-6 py-5">
          <Logo />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 pb-16">
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <div className="bd-pulse w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
              <Smartphone size={26} color="white" />
            </div>
            <div>
              <div className="font-semibold text-[15px] mb-1">Väntar på signering…</div>
              <div className="text-sm text-slate">Öppna BankID-appen i din mobil</div>
            </div>
            <Loader2 size={18} className="bd-spin text-forest" />
            <p className="text-xs text-slate">Simulerad identifiering i den här prototypen.</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "fetching") {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-center px-6 py-5">
          <Logo />
        </div>
        <div className="flex-1 flex items-center justify-center px-5 pb-16">
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-forest">
              <Loader2 size={26} color="white" className="bd-spin" />
            </div>
            <div>
              <div className="font-semibold text-[15px] mb-1">Hämtar dina försäkringar…</div>
              <div className="text-sm text-slate">Söker igenom svenska försäkringsbolag</div>
            </div>
            <p className="text-xs text-slate">Simulerad identifiering i den här prototypen.</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-center px-6 py-5">
          <Logo />
        </div>
        <div className="flex-1 flex items-start justify-center px-5 pb-16">
          <div className="w-full max-w-md bd-fade">
            <div className="flex items-center gap-2 mb-4 text-forest">
              <Check size={18} />
              <span className="text-sm font-semibold">Vi hittade {found.length} försäkringar</span>
            </div>
            <div className="flex flex-col gap-3 mb-6">
              {found.map(({ item, quote }) => (
                <div key={item.id} className="bg-white rounded-2xl border border-line p-5">
                  <div className="font-semibold text-[15px] mb-1">{itemTitle(item)}</div>
                  <div className="text-xs mb-4 text-slate">{itemSummary(item)}</div>
                  <div className="pt-4 border-t border-line flex items-center justify-between">
                    <div className="font-semibold text-sm">{quote.name}</div>
                    <div className="text-right">
                      <div className="bd-display text-lg text-forest">{quote.price} kr</div>
                      <div className="text-xs text-slate">per månad</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addAllAndContinue}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
            >
              Lägg till alla och fortsätt <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "flag-missing") {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <div className="w-full flex items-center justify-center px-6 py-5">
          <Logo />
        </div>
        <div className="flex-1 flex items-start justify-center px-5 pb-16">
          <div className="w-full max-w-md bd-fade">
            <span className="bd-eyebrow">Steg 2 av 3</span>
            <MissingInsuranceFlagger
              title="Är det något som saknas?"
              intro="Har du fler försäkringar som inte dök upp? Berätta vilken typ så hämtar Buddy in den åt dig."
              doneLabel="Nej, allt är med"
              onDone={() => setPhase("fullmakt")}
            />
          </div>
        </div>
      </div>
    );
  }

  // phase === "fullmakt"
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full flex items-center justify-center px-6 py-5">
        <Logo />
      </div>
      <div className="flex-1 flex items-start justify-center px-5 pb-16">
        <div className="w-full max-w-md">
          <FullmaktSigning onDone={finish} onSkip={finish} />
        </div>
      </div>
    </div>
  );
}
