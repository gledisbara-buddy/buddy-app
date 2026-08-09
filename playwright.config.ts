import { defineConfig, devices } from "@playwright/test";

// Grundläggande smoke-tester för de mest kritiska flödena — inte en
// fullständig E2E-svit. Kör mot en riktig dev-server (webServer nedan
// startar den automatiskt) mot samma Supabase-projekt som utveckling,
// så testerna skapar riktiga (men unika, tidsstämplade) testkonton —
// samma mönster som all manuell verifiering i den här kodbasen hittills.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
