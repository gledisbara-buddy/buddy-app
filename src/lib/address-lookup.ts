export type AddressMatch = { adress: string; postnummer: string; ort: string };

const ADDRESS_BOOK: AddressMatch[] = [
  { adress: "Storgatan 4", postnummer: "111 23", ort: "Stockholm" },
  { adress: "Sveavägen 44", postnummer: "111 34", ort: "Stockholm" },
  { adress: "Kungsgatan 12", postnummer: "411 19", ort: "Göteborg" },
  { adress: "Avenyn 7", postnummer: "411 36", ort: "Göteborg" },
  { adress: "Södra Förstadsgatan 2", postnummer: "211 43", ort: "Malmö" },
  { adress: "Storgatan 21", postnummer: "211 42", ort: "Malmö" },
  { adress: "Dragarbrunnsgatan 5", postnummer: "753 20", ort: "Uppsala" },
  { adress: "Vaksalagatan 10", postnummer: "753 31", ort: "Uppsala" },
  { adress: "Drottninggatan 30", postnummer: "252 21", ort: "Helsingborg" },
  { adress: "Linnégatan 8", postnummer: "582 22", ort: "Linköping" },
];

/**
 * Simulated address lookup — swap this implementation for a real geocoding API later
 * (call site stays the same: AddressField only depends on this function signature).
 */
export function searchAddress(query: string): Promise<AddressMatch[]> {
  const q = query.trim().toLowerCase();
  return new Promise((resolve) => {
    setTimeout(
      () => {
        if (q.length < 2) {
          resolve([]);
          return;
        }
        resolve(ADDRESS_BOOK.filter((a) => `${a.adress} ${a.ort}`.toLowerCase().includes(q)));
      },
      250 + Math.random() * 200
    );
  });
}
