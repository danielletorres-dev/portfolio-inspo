// Takes a screenshot of every website in links.json that doesn't have one yet.
// Runs on GitHub (see .github/workflows/screenshots.yml) whenever links.json changes.
import { chromium } from "playwright";
import fs from "node:fs";

const SOCIAL = /(^|\.)(instagram\.com|tiktok\.com|youtube\.com|youtu\.be|threads\.(net|com))$/;
export const slug = url => {
  const u = new URL(url);
  return (u.hostname.replace(/^www\./, "") + u.pathname)
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
};

const data = JSON.parse(fs.readFileSync("links.json", "utf8"));
const todo = data.links.filter(l => {
  let host; try { host = new URL(l.url).hostname; } catch { return false; }
  return !SOCIAL.test(host) && !l.image && !fs.existsSync(`screenshots/${slug(l.url)}.jpg`);
});
console.log(`${todo.length} website(s) need a screenshot`);
if (!todo.length) process.exit(0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
for (const l of todo) {
  try {
    await page.goto(l.url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => page.goto(l.url, { waitUntil: "load", timeout: 45000 }));
    await page.waitForTimeout(5000); // let intro animations finish
    await page.screenshot({ path: `screenshots/${slug(l.url)}.jpg`, type: "jpeg", quality: 80 });
    console.log("✓", l.url);
  } catch (e) { console.log("✗", l.url, e.message); }
}
await browser.close();
