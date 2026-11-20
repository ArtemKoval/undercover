// Captures the live desk on the real dev stack for the active pack: the
// sign-in page, the queue, one case, the scoreboard, and the settings.
// Run from crm/ with the stack up:
//   CRM_DOMAIN=garage SHOT_DIR=docs/screenshots/garage \
//   WORKER=gordon.vale@autofix.example node e2e/capture_real.mjs
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The default address is 127.0.0.1, not localhost: the dev auth service
// allows exactly the 127.0.0.1 origin, so a localhost visit fails CORS.
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const OUT = process.env.SHOT_DIR ?? "docs/screenshots";
const PACK = process.env.CRM_DOMAIN ?? "insurance";
const PASSWORD = process.env.PASSWORD ?? "crm-dev";

// The pack's own first senior worker and first case keep the defaults
// pack-true: the senior worker sees the over-limit desk.
const workers = JSON.parse(
  readFileSync(`domains/${PACK}/data/workers.json`, "utf8"),
);
const senior = workers.find((w) => w.can_approve_over_limit) ?? workers[0];
const WORKER = process.env.WORKER ?? senior.email;
const cases = JSON.parse(
  readFileSync(`domains/${PACK}/data/cases.json`, "utf8"),
);
const CASE_ID = process.env.CASE_ID ?? cases[0].case_id;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(BASE);
await page.waitForTimeout(1500);
await page.screenshot({ path: join(OUT, "r1-sign-in.png"), fullPage: true });

await page.getByLabel("Email").fill(WORKER);
await page.getByLabel("Password").fill(PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
// The sign-in must land on the desk. A stay on the form means a failed
// post, and every later shot would carry the sign-in page.
await page
  .getByRole("heading", { name: "Sign in" })
  .waitFor({ state: "detached", timeout: 10000 })
  .catch(() => {
    throw new Error(
      "The sign-in did not complete. Check the auth service, the password, and AUTH_ALLOW_ORIGIN.",
    );
  });
await page.waitForTimeout(1500);
await page.screenshot({ path: join(OUT, "r2-queue.png"), fullPage: true });

const link = page.getByRole("link", { name: new RegExp(CASE_ID) }).first();
try {
  await link.waitFor({ state: "visible", timeout: 5000 });
} catch {
  console.log(`The case link ${CASE_ID} stayed invisible; no case shot.`);
}
if (await link.isVisible()) {
  await link.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, "r3-case.png"), fullPage: true });
}

await page.goto(`${BASE}/scoreboard`);
await page.waitForTimeout(1200);
await page.screenshot({ path: join(OUT, "r4-scoreboard.png"), fullPage: true });

await page.goto(`${BASE}/settings`);
await page.waitForTimeout(1200);
await page.screenshot({ path: join(OUT, "r5-settings.png"), fullPage: true });

await browser.close();
console.log(`captured the live desk into ${OUT}`);
