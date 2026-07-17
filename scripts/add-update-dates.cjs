/**
 * Add visible "Updated: YYYY-MM-DD" to all content pages.
 * AI crawlers use visible dates as freshness signals.
 * Safe to re-run — checks for existing date line.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TODAY = '2026-07-17';

const UPDATE_LINE = `\n<div style="text-align:center;padding:8px 0 6px;font-size:12px;color:var(--text3)">📅 Updated: ${TODAY}</div>\n`;

function addUpdateDate(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already has a visible update date
  if (html.includes('📅 Updated:') || html.includes('page-updated')) return false;

  // Inject before </main>
  if (html.includes('</main>')) {
    html = html.replace('</main>', UPDATE_LINE + '</main>');
    fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Adding visible update dates...\n');

let count = 0;
function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'data' && entry.name !== 'scripts' && entry.name !== 'fonts' && entry.name !== 'images' && !entry.name.startsWith('category:')) {
      walkDir(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      if (addUpdateDate(path.join(dir, entry.name))) count++;
    }
  }
}
walkDir(ROOT);
for (const f of fs.readdirSync(ROOT)) {
  if (f.endsWith('.html')) {
    if (addUpdateDate(path.join(ROOT, f))) count++;
  }
}

console.log(`✅ Added update dates to ${count} pages\n`);
