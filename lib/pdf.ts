import { execSync } from "child_process";
import puppeteer, { type Browser } from "puppeteer";

let browser: Browser | null = null;
let cachedExecutablePath: string | undefined;

// Puppeteer's bundled Chromium will not launch on Replit's NixOS containers
// because the prebuilt binary expects FHS-style dynamic libs that do not
// exist on Nix. The fix is to point Puppeteer at a Nix-provided Chromium
// (added via `installSystemDependencies` -> ends up on PATH).
//
// Priority:
//   1. PUPPETEER_EXECUTABLE_PATH (explicit override — useful for tests / pinning)
//   2. `which chromium` (Nix-provided in dev + reserved-VM deploy). Puppeteer
//      requires an absolute path, so we resolve PATH ourselves.
//   3. Let Puppeteer fall back to its bundled Chromium (will fail on NixOS,
//      but kept as last resort for non-Nix hosts).
function resolveExecutablePath(): string | undefined {
  if (cachedExecutablePath !== undefined) return cachedExecutablePath || undefined;
  const explicit = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (explicit) {
    cachedExecutablePath = explicit;
    return explicit;
  }
  try {
    const which = execSync("which chromium", { encoding: "utf-8" }).trim();
    if (which) {
      cachedExecutablePath = which;
      return which;
    }
  } catch {
    // chromium not on PATH; fall through to undefined so Puppeteer uses its bundle.
  }
  cachedExecutablePath = "";
  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) return browser;
  browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveExecutablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  return browser;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60_000 });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function shutdownPuppeteer(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}
