import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

// Grundläggande smoke-tester för de mest kritiska flödena — inte en
// fullständig E2E-svit. Kör mot en riktig dev-server (webServer nedan
// startar den automatiskt) mot samma Supabase-projekt som utveckling.
// Inloggningsberoende tester återanvänder ett befintligt, bekräftat
// testkonto (E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD i .env.local) istället
// för att registrera nya konton — obligatorisk e-postbekräftelse gör att
// nya konton inte längre kan slutföras utan en riktig, läsbar inkorg.
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
