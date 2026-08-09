// Genererar en värvningskod från namnet — upp till 4 versaler (bara
// bokstäver), plus en 4-siffrig slumpsuffix. 4 siffror (inte 3) för att
// hålla kollisionsrisken låg mot `profiles.referral_code`s unika
// begränsning i en demo-skala användarbas; krockar misslyckas tyst via
// samma logWriteError-mönster som övriga skrivningar.
export function generateCode(name?: string | null): string {
  const base = (name ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "VAN";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}
