/**
 * Inject Google Analytics 4 snippet into all HTML pages.
 * Safe to re-run — checks for existing GA4 before injecting.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GA4_ID = 'G-D8SES2BJRL';

const GA4_SNIPPET = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA4_ID}');
</script>`;

function injectGA4(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already has GA4
  if (html.includes('googletagmanager.com/gtag') || html.includes(`gtag('config', '${GA4_ID}')`)) {
    return false;
  }

  // Inject after <head> opening — before existing scripts
  html = html.replace('<head>', '<head>\n' + GA4_SNIPPET);
  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

console.log('🔧 Injecting GA4 (G-D8SES2BJRL)...\n');

let count = 0;
function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'data' && entry.name !== 'scripts' && entry.name !== 'fonts' && entry.name !== 'images' && !entry.name.startsWith('category:')) {
      walkDir(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      if (injectGA4(path.join(dir, entry.name))) count++;
    }
  }
}
walkDir(ROOT);
// Also root-level .html files
for (const f of fs.readdirSync(ROOT)) {
  if (f.endsWith('.html')) {
    const fp = path.join(ROOT, f);
    if (injectGA4(fp)) count++;
  }
}

console.log(`✅ Injected GA4 into ${count} pages\n`);
