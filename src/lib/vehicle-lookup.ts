export type VehicleInfo = { markeModell: string; arsmodell: number };

export const VEHICLE_BOOK: Record<string, VehicleInfo> = {
  ABC123: { markeModell: "Volvo XC60", arsmodell: 2019 },
  DEF456: { markeModell: "Volkswagen Golf", arsmodell: 2017 },
  GHI789: { markeModell: "Toyota RAV4", arsmodell: 2021 },
  JKL321: { markeModell: "Skoda Octavia", arsmodell: 2020 },
  MNO654: { markeModell: "BMW 320i", arsmodell: 2018 },
};

const FALLBACK_MODELS: VehicleInfo[] = [
  { markeModell: "Volvo V60", arsmodell: 2020 },
  { markeModell: "Volkswagen Passat", arsmodell: 2019 },
  { markeModell: "Toyota Corolla", arsmodell: 2021 },
];

/**
 * Simulated vehicle lookup by registration number — swap this implementation for a real
 * biluppgifts-API later (call site stays the same: BilForm only depends on this signature).
 */
export function lookupVehicle(regnummer: string): Promise<VehicleInfo | null> {
  const key = regnummer.trim().toUpperCase().replace(/\s/g, "");
  return new Promise((resolve) => {
    setTimeout(
      () => {
        if (key.length < 5) {
          resolve(null);
          return;
        }
        if (VEHICLE_BOOK[key]) {
          resolve(VEHICLE_BOOK[key]);
          return;
        }
        const index = key.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % FALLBACK_MODELS.length;
        resolve(FALLBACK_MODELS[index]);
      },
      400 + (key.length % 3) * 150
    );
  });
}
