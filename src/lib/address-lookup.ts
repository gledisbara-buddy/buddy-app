export type AddressMatch = { adress: string; postnummer: string; ort: string };

/**
 * Address lookup backed by /api/address-search (Geoapify autocomplete, server-side
 * so the API key never reaches the browser). AddressField only depends on this
 * function's signature, so the backing implementation can change without touching it.
 */
export async function searchAddress(query: string): Promise<AddressMatch[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const res = await fetch(`/api/address-search?query=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data: { results: AddressMatch[] } = await res.json();
    return data.results;
  } catch {
    return [];
  }
}
