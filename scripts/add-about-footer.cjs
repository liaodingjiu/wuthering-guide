/**
 * Add About link to footer on all pages + update sitemap.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TODAY = '2026-07-17';

let count = 0;

// Add About link to footer
function addAboutToFooter(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already has about link in footer
  if (html.includes('href="/about"')) return false;

  // Add About before Privacy in footer-links
  if (html.includes('<div class="footer-links"><a href="/privacy"')) {
    html = html.replace(
      '<div class="footer-links"><a href="/privacy"',
      '<div class="footer-links"><a href="/about">About</a><a href="/privacy"'
    );
    fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Adding About link to footer...\n');

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'data' && entry.name !== 'scripts' && entry.name !== 'fonts' && entry.name !== 'images' && !entry.name.startsWith('category:')) {
      walkDir(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      if (addAboutToFooter(path.join(dir, entry.name))) count++;
    }
  }
}
walkDir(ROOT);
for (const f of fs.readdirSync(ROOT)) {
  if (f.endsWith('.html') && f !== 'about.html') {
    if (addAboutToFooter(path.join(ROOT, f))) count++;
  }
}

console.log(`✅ Added About link to ${count} pages`);

// Update sitemap — add about page + bump dates
console.log('\n🗺️  Updating sitemap...');
const sitemapPath = path.join(ROOT, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');

// Add about page if not present
if (!sitemap.includes('wutzone.com/about')) {
  const aboutEntry = `\n  <url><loc>https://wutzone.com/about</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
  // Insert after homepage entry
  sitemap = sitemap.replace('</url>\n  <url><loc>https://wutzone.com/characters/', `</url>${aboutEntry}\n  <url><loc>https://wutzone.com/characters/`);
}

// Update all lastmod dates
sitemap = sitemap.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${TODAY}</lastmod>`);
fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log(`✅ Sitemap updated — added /about, dates → ${TODAY}\n`);
