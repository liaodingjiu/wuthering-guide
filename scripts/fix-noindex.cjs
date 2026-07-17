/**
 * Fix: change noindex,follow → index,follow on real character pages.
 * Keeps noindex on: category pages, privacy, terms, build-planner/editor
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHAR_DIR = path.join(ROOT, 'characters');

let count = 0;
for (const dir of fs.readdirSync(CHAR_DIR)) {
  if (dir.startsWith('category:')) continue;
  const fp = path.join(CHAR_DIR, dir, 'index.html');
  if (!fs.existsSync(fp)) continue;

  let html = fs.readFileSync(fp, 'utf8');
  if (html.includes('content="noindex,follow"')) {
    html = html.replace('content="noindex,follow"', 'content="index,follow"');
    fs.writeFileSync(fp, html, 'utf8');
    console.log(`  ✅ ${dir}: noindex → index`);
    count++;
  }
}

// Also check root .html files with accidental noindex
for (const f of fs.readdirSync(ROOT)) {
  if (!f.endsWith('.html')) continue;
  if (f === 'privacy.html' || f === 'terms.html') continue;
  const fp = path.join(ROOT, f);
  let html = fs.readFileSync(fp, 'utf8');
  if (html.includes('content="noindex')) {
    html = html.replace(/content="noindex[^"]*"/, 'content="index,follow"');
    fs.writeFileSync(fp, html, 'utf8');
    console.log(`  ✅ ${f}: noindex → index`);
    count++;
  }
}

console.log(`\n✅ Fixed ${count} pages\n`);
