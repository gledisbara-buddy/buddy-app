// Enkel formatvalidering av svenska mobilnummer — verifierar inte att
// numret faktiskt existerar, samma pragmatiska nivå som personnummer-
// maskningen på andra ställen i appen.
const SWEDISH_MOBILE_REGEX = /^(?:\+46|0046|0)7[02369]\d{7}$/;

export function isValidSwedishMobile(value: string): boolean {
  return SWEDISH_MOBILE_REGEX.test(value.replace(/[\s-]/g, ""));
}
