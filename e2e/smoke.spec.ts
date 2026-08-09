import { test, expect, type Page } from "@playwright/test";

// Grundläggande smoke-tester för de mest kritiska flödena. Varje testkonto
// får en unik, tidsstämplad e-post — samma engångskontomönster som all
// manuell verifiering i den här kodbasen använt hela utvecklingen igenom.
function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}@example.com`;
}

const PASSWORD = "SmokeTest123!";

// Efter signup hamnar en ny användare i onboardingen (namn, ev. fullmakt
// osv.), inte direkt på översikten. "Hoppa över, jag gör det sen" finns
// på varje steg — klicka igenom tills Profilmeny (TopBar) syns.
async function signUpAndReachDashboard(page: Page, email: string) {
  await page.goto("/login?type=privat");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Skapa konto" }).click();

  const profileMenu = page.getByRole("button", { name: "Profilmeny" });
  for (let i = 0; i < 10; i++) {
    if (await profileMenu.isVisible().catch(() => false)) break;
    // Onboardingen byter steg (och därmed DOM) mellan varje klick, så
    // "Hoppa över"-knappen hinner ofta bli detached innan klicket
    // hinner utföras — fånga det och försök igen på nästa varv.
    await page
      .getByRole("button", { name: /Hoppa över/i })
      .click({ timeout: 2_000 })
      .catch(() => {});
  }
  await expect(profileMenu).toBeVisible({ timeout: 15_000 });

  // Första besöket på översikten visar en introduktions-overlay
  // ("Såhär funkar Buddy") som blockerar klick tills den stängs — den
  // kan hinna monteras strax EFTER att Profilmeny redan syns, så en
  // engångskoll här är racy. Vänta in den (om den kommer) och stäng.
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
  test("ny användare kan skapa konto och nå en inloggad vy", async ({ page }) => {
    const email = uniqueEmail("smoke.signup");
    await signUpAndReachDashboard(page, email);
  });

  test("felaktigt lösenord vid inloggning visar tydligt fel", async ({ page }) => {
    const email = uniqueEmail("smoke.badlogin");
    await signUpAndReachDashboard(page, email);

    await page.getByRole("button", { name: "Profilmeny" }).click();
    await page.getByRole("button", { name: "Logga ut" }).click();

    await page.goto("/login?type=privat");
    await page.getByRole("button", { name: /Har du redan ett konto\? Logga in/i }).click();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill("FelLosenord123!");
    await page.getByRole("button", { name: "Logga in" }).click();
    await expect(page.getByText(/Invalid login credentials|Felaktiga inloggningsuppgifter/i)).toBeVisible();
  });
});

test.describe("Boka specialist", () => {
  test("inloggad kund kan boka ett möte end-to-end", async ({ page }) => {
    const email = uniqueEmail("smoke.booking");
    await signUpAndReachDashboard(page, email);

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

    await page.locator('input[placeholder="sam@exempel.se"]').fill(email);
    await page.getByRole("button", { name: "Bekräfta bokning" }).click();

    await expect(page.getByText("Din tid är bokad")).toBeVisible();
    await expect(page.getByText(`Bekräftelse skickad till ${email}`)).toBeVisible();
  });
});
