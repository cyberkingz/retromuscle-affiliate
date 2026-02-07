import fs from "node:fs";
import path from "node:path";

import { chromium, devices } from "playwright";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3010";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir =
  process.env.AUDIT_OUT_DIR ??
  path.join(process.cwd(), "output", "playwright", "ui-audit", stamp);

fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { slug: "landing", pathname: "/" },
  { slug: "apply", pathname: "/apply" },
  { slug: "login", pathname: "/login" },
  { slug: "creators", pathname: "/creators" },
  { slug: "onboarding", pathname: "/onboarding" },
  { slug: "contract", pathname: "/contract" },
  { slug: "dashboard", pathname: "/dashboard" },
  { slug: "uploads", pathname: "/uploads" },
  { slug: "payouts", pathname: "/payouts" },
  { slug: "settings", pathname: "/settings" },
  { slug: "admin", pathname: "/admin" },
  { slug: "admin-applications", pathname: "/admin/applications" }
];

const variants = [
  {
    name: "desktop",
    options: {
      viewport: { width: 1440, height: 900 }
    }
  },
  {
    name: "iphone13",
    options: devices["iPhone 13"]
  }
];

function fileSafe(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "_");
}

async function main() {
  const browser = await chromium.launch();

  try {
    for (const variant of variants) {
      const context = await browser.newContext(variant.options);
      const page = await context.newPage();

      for (const target of targets) {
        const url = new URL(target.pathname, baseUrl).toString();
        const outPath = path.join(outDir, `${fileSafe(target.slug)}.${variant.name}.png`);

        try {
          await page.goto(url, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(700);
          await page.screenshot({ path: outPath, fullPage: true });
          // eslint-disable-next-line no-console
          console.log(`[ui-audit] ${variant.name} ${target.pathname} -> ${outPath}`);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`[ui-audit] failed ${variant.name} ${target.pathname}:`, error);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

