export type OperatorPackage = {
  namn: string;
  dataGb?: number;
  obegransatData: boolean;
  prisPerManad: number;
  bindningstidManader?: number;
};

export type OperatorMatch = {
  operator: string;
  paket: OperatorPackage[];
};

// Verkliga svenska operatörer (se docs/kundresa-v2-steg2-plan.md, Del D) —
// paketen är exempeldata, inte riktiga priser.
const OPERATOR_PAKET: Record<string, OperatorPackage[]> = {
  Telia: [
    { namn: "Telia Smart 15GB", dataGb: 15, obegransatData: false, prisPerManad: 279, bindningstidManader: 24 },
    { namn: "Telia Smart Fri surf", obegransatData: true, prisPerManad: 399, bindningstidManader: 24 },
  ],
  Tele2: [
    { namn: "Tele2 Mobil 10GB", dataGb: 10, obegransatData: false, prisPerManad: 229 },
    { namn: "Tele2 Mobil Max", obegransatData: true, prisPerManad: 359 },
  ],
  Telenor: [
    { namn: "Telenor Flex 15GB", dataGb: 15, obegransatData: false, prisPerManad: 269, bindningstidManader: 12 },
    { namn: "Telenor Flex Obegränsad", obegransatData: true, prisPerManad: 379, bindningstidManader: 12 },
  ],
  Tre: [
    { namn: "Tre Surf 20GB", dataGb: 20, obegransatData: false, prisPerManad: 199 },
    { namn: "Tre Surf Fri", obegransatData: true, prisPerManad: 329 },
  ],
  Comviq: [
    { namn: "Comviq Kontant 8GB", dataGb: 8, obegransatData: false, prisPerManad: 149 },
    { namn: "Comviq Fri surf", obegransatData: true, prisPerManad: 259 },
  ],
  Halebop: [
    { namn: "Halebop 12GB", dataGb: 12, obegransatData: false, prisPerManad: 179 },
    { namn: "Halebop Fri surf", obegransatData: true, prisPerManad: 289 },
  ],
  Fello: [{ namn: "Fello 15GB", dataGb: 15, obegransatData: false, prisPerManad: 159 }],
  Vimla: [{ namn: "Vimla Eget abonnemang 10GB", dataGb: 10, obegransatData: false, prisPerManad: 139 }],
};

const OPERATORER = Object.keys(OPERATOR_PAKET);

/**
 * Simulerad uppslagning av mobiloperatör utifrån telefonnummer — samma
 * abstraktionsnivå som lookupVehicle() i vehicle-lookup.ts. Byts ut mot en
 * riktig operatörs-API senare utan att TelekomForm behöver ändras.
 */
export function lookupOperator(phoneNumber: string): Promise<OperatorMatch | null> {
  const digits = phoneNumber.replace(/\D/g, "");
  return new Promise((resolve) => {
    setTimeout(
      () => {
        if (digits.length < 8) {
          resolve(null);
          return;
        }
        const index = digits.split("").reduce((sum, d) => sum + Number(d), 0) % OPERATORER.length;
        const operator = OPERATORER[index];
        resolve({ operator, paket: OPERATOR_PAKET[operator] });
      },
      450 + (digits.length % 4) * 120
    );
  });
}
