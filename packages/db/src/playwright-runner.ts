import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STUB_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Real Playwright when available; stub PNG otherwise */
export async function captureBrowserScreenshot(
  workDirAbs: string,
  url: string,
): Promise<{ screenshotPath: string; usedPlaywright: boolean }> {
  const screenshotPath = 'screenshot.png';
  const absPath = join(workDirAbs, screenshotPath);

  if (process.env.OPERON_PLAYWRIGHT_STUB === '1') {
    writeFileSync(absPath, STUB_PNG);
    return { screenshotPath, usedPlaywright: false };
  }

  try {
    const pw = await import('playwright');
    const browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.screenshot({ path: absPath, fullPage: false });
    await browser.close();
    return { screenshotPath, usedPlaywright: true };
  } catch {
    writeFileSync(absPath, STUB_PNG);
    return { screenshotPath, usedPlaywright: false };
  }
}
