import { test, expect, type Page } from "@playwright/test";

// Grundläggande smoke-tester för de mest kritiska flödena.
//
// Obligatorisk e-postbekräftelse (6-siffrig kod, skickad via Resend) gör
// att en helt ny signup inte längre kan slutföras automatiskt — det finns
// ingen riktig inkorg att läsa koden ur i CI/Playwright. Inloggningsberoende
// tester återanvänder därför ett befintligt, redan bekräftat testkonto
// (E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD i .env.local — se buddy_test_accounts
// i minnesanteckningarna för vilket konto). Signup-testet verifierar bara
// att flödet fram till kod-skärmen fungerar, utan att slutföra det.
function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}@example.com`;
}

const PASSWORD = "SmokeTest123!";

const LOGIN_EMAIL = process.env.E2E_LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD;

// Loggar in med ett befintligt, bekräftat konto och väntar in översikten.
// Kontot har redan slutfört onboardingen tidigare, så ingen "Hoppa
// över"-klickning behövs här (till skillnad från ett helt nytt konto).
async function loginAndReachDashboard(page: Page) {
  test.skip(!LOGIN_EMAIL || !LOGIN_PASSWORD, "E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD saknas i .env.local");

  await page.goto("/login?type=privat");
  await page.getByRole("button", { name: /Har du redan ett konto\? Logga in/i }).click();
  await page.locator('input[type="email"]').fill(LOGIN_EMAIL!);
  await page.locator('input[type="password"]').fill(LOGIN_PASSWORD!);
  await page.getByRole("button", { name: "Logga in" }).click();

  const profileMenu = page.getByRole("button", { name: "Profilmeny" });
  await expect(profileMenu).toBeVisible({ timeout: 15_000 });

  // Introduktions-overlayn ("Såhär funkar Buddy") visas bara vid första
  // besöket någonsin på översikten för ett konto — ett redan använt
  // testkonto har oftast redan sett den, men vänta in den om den kommer.
  const scrim = page.locator(".bd-scrim");
  await scrim.waitFor({ state: "visible", timeout: 1_500 }).catch(() => {});
  if (await scrim.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape");
    await expect(scrim).toBeHidden({ timeout: 5_000 });
  }
}

test.describe("Marknadssida", () => {
  test("startsidan laddar med förväntat innehåll", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Allt du betalar för/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Kom igång" }).first()).toBeVisible();
  });

  test("FAQ visar korrekt inloggningsmetod (regression: falskt BankID-påstående)", async ({ page }) => {
    await page.goto("/vanliga-fragor");
    await page.getByText("Är mina uppgifter säkra?").click();
    await expect(page.getByText(/Ditt konto skyddas med lösenord/i)).toBeVisible();
    await expect(page.getByText(/loggar in med BankID/i)).toHaveCount(0);
  });

  test("juridiksidor laddar", async ({ page }) => {
    for (const path of ["/villkor", "/integritetspolicy", "/cookies"]) {
      await page.goto(path);
      await expect(page.getByText(/utkast|ersätter inte juridisk rådgivning/i)).toBeVisible();
    }
  });
});

test.describe("Konto och inloggning", () => {
  test("signup-knappen kräver ett giltigt telefonnummer", async ({ page }) => {
    // Verifierar bara gate-logiken (A1-A3), inte hela signup-till-kod-resan
    // — att faktiskt skicka formuläret skulle skapa ett nytt konto och
    // trigga ett e-postutskick vid varje testkörning, och @example.com-
    // adresser (den enda typ som är säker att använda i ett automatiskt
    // test) avvisas direkt av Resend eftersom domänen inte kan ta emot post.
    const email = uniqueEmail("smoke.signup");
    await page.goto("/login?type=privat");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(PASSWORD);

    const submit = page.getByRole("button", { name: "Skapa konto" });
    await expect(submit).toBeDisabled();

    await page.locator('input[type="tel"]').fill("123");
    await expect(submit).toBeDisabled();

    await page.locator('input[type="tel"]').fill("0701234567");
    await expect(submit).toBeEnabled();
  });

  test("felaktigt lösenord vid inloggning visar tydligt fel", async ({ page }) => {
    test.skip(!LOGIN_EMAIL || !LOGIN_PASSWORD, "E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD saknas i .env.local");

    await page.goto("/login?type=privat");
    await page.getByRole("button", { name: /Har du redan ett konto\? Logga in/i }).click();
    await page.locator('input[type="email"]').fill(LOGIN_EMAIL!);
    await page.locator('input[type="password"]').fill("FelLosenord123!");
    await page.getByRole("button", { name: "Logga in" }).click();
    await expect(page.getByText(/Invalid login credentials|Felaktiga inloggningsuppgifter/i)).toBeVisible();
  });
});

test.describe("Boka specialist", () => {
  test("inloggad kund kan boka ett möte end-to-end", async ({ page }) => {
    await loginAndReachDashboard(page);

    await page.goto("/book");
    await page.getByRole("button", { name: "Övrigt" }).click();
    await page.getByRole("button", { name: "Fortsätt" }).click();
    await page.getByText("Videosamtal", { exact: false }).first().click();
    await page.getByRole("button", { name: "Fortsätt" }).click();

    // Datumen är rullande (relativa till dagens datum), så testet väljer
    // första tillgängliga dag/tid istället för ett hårdkodat datum.
    await page.locator(".bd-scroll button").first().click();
    await page.locator(".grid.grid-cols-3 button").first().click();
    await page.getByRole("button", { name: "Fortsätt" }).click();

    await page.locator('input[placeholder="sam@exempel.se"]').fill(LOGIN_EMAIL!);
    await page.getByRole("button", { name: "Bekräfta bokning" }).click();

    await expect(page.getByText("Din tid är bokad")).toBeVisible();
    await expect(page.getByText(`Bekräftelse skickad till ${LOGIN_EMAIL}`)).toBeVisible();
  });
});
