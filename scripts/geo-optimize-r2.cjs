/**
 * GEO Optimization Round 2 — 5-in-1:
 *   1. Weapon pages: add FAQPage + BreadcrumbList schema (48 pages)
 *   2. Character/Echo pages: add BreadcrumbList schema (109 pages)
 *   3. List/section pages: add ItemList/Article schema
 *   4. Footer brand: "Wuthering Waves Database" → "WutZone" site-wide
 *   5. Sitemap: update lastmod dates
 *
 * Safe to re-run — idempotent replacements.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TODAY = new Date().toISOString().split('T')[0];

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }

// ── Data index ──────────────────────────────────────────────
const charData = {};
const weaponData = {};
const echoData = {};

const charDir = path.join(ROOT, 'data/characters');
for (const f of fs.readdirSync(charDir)) {
  if (!f.endsWith('.json')) continue;
  const raw = readJSON(path.join(charDir, f));
  if (!raw) continue;
  const d = { s: raw.s || raw.slug, n: raw.n || raw.name, r: raw.r || raw.rarity,
    e: raw.e || raw.attribute, w: raw.w || raw.weapon, cls: raw.cls,
    desc: raw.desc || raw.description,
    hp: raw.hp || (raw.stats && raw.stats.hp),
    atk: raw.atk || (raw.stats && raw.stats.atk),
    def: raw.def || (raw.stats && raw.stats.def),
    cr: raw.cr, cd: raw.cd, er: raw.er, skills: raw.skills,
    recWeapon: raw.recWeapon, recEcho: raw.recEcho, recSet: raw.recSet };
  if (d.s && d.n) charData[d.s] = d;
}

const wepDir = path.join(ROOT, 'data/weapons');
for (const f of fs.readdirSync(wepDir)) {
  if (!f.endsWith('.json')) continue;
  const d = readJSON(path.join(wepDir, f));
  if (d && d.slug) weaponData[d.slug] = d;
}

const echoDir = path.join(ROOT, 'data/echos');
for (const f of fs.readdirSync(echoDir)) {
  if (!f.endsWith('.json')) continue;
  const d = readJSON(path.join(echoDir, f));
  if (d && d.slug) echoData[d.slug] = d;
}

// ── Helpers ─────────────────────────────────────────────────
function stars(n) { return '★'.repeat(Number(n) || 0); }

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function escJSON(str) {
  return String(str).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t');
}

// Find best characters for a weapon
function charsForWeapon(wepSlug) {
  const w = weaponData[wepSlug];
  if (!w) return [];
  const results = [];
  for (const [slug, c] of Object.entries(charData)) {
    if (c.w && c.w.toLowerCase() === w.type.toLowerCase()) {
      results.push({ slug, name: c.n, rarity: c.r });
    }
  }
  results.sort((a,b) => (b.rarity|0)-(a.rarity|0) || a.name.localeCompare(b.name));
  return results.slice(0, 5);
}

// Find best characters for an echo (by element)
function charsForEcho(echoSlug) {
  const e = echoData[echoSlug];
  if (!e || !e.element) return [];
  const results = [];
  for (const [slug, c] of Object.entries(charData)) {
    if (c.e && c.e.toLowerCase() === e.element.toLowerCase()) {
      results.push({ slug, name: c.n, rarity: c.r });
    }
  }
  results.sort((a,b) => (b.rarity|0)-(a.rarity|0) || a.name.localeCompare(b.name));
  return results.slice(0, 5);
}

// Find best weapon for a character
function bestWeaponForChar(charSlug) {
  const c = charData[charSlug];
  if (!c || !c.w) return [];
  const matches = [];
  for (const [slug, w] of Object.entries(weaponData)) {
    if (w.type && w.type.toLowerCase() === c.w.toLowerCase()) {
      matches.push({ slug, name: w.name, rarity: w.rarity });
    }
  }
  matches.sort((a,b) => (b.rarity|0)-(a.rarity|0));
  return matches.slice(0, 3);
}

// Find echoes for a character (by element)
function echoesForChar(charSlug) {
  const c = charData[charSlug];
  if (!c || !c.e) return [];
  const results = [];
  for (const [slug, e] of Object.entries(echoData)) {
    if (e.element && e.element.toLowerCase() === c.e.toLowerCase()) {
      results.push({ slug, name: e.name, cost: e.cost, sonata: e.sonata_effect });
    }
  }
  results.sort((a,b) => (b.cost|0)-(a.cost|0) || a.name.localeCompare(b.name));
  return results.slice(0, 4);
}

// Find similar weapons (same type)
function similarWeapons(wepSlug) {
  const w = weaponData[wepSlug];
  if (!w) return [];
  const sameType = Object.entries(weaponData)
    .filter(([s, w2]) => w2.type === w.type && s !== wepSlug)
    .sort((a,b) => (b[1].rarity|0)-(a[1].rarity|0))
    .slice(0, 4);
  return sameType.map(([s, w2]) => ({ slug: s, name: w2.name, rarity: w2.rarity }));
}

// Build breadcrumb JSON-LD
function buildBreadcrumb(items) {
  const listItems = items.map((item, i) => ({
    '@type': 'ListItem',
    'position': i + 1,
    'name': item.name,
    'item': item.url
  }));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': listItems
  });
}

// ── Schema generators ───────────────────────────────────────

// FAQPage for weapons
function weaponFAQSchema(w) {
  const chars = charsForWeapon(w.slug);
  const bestChar = chars.length > 0 ? chars[0].name : w.type + ' Resonators';
  const sim = similarWeapons(w.slug);
  const simNames = sim.slice(0, 3).map(s => s.name).join(', ');

  const faqs = [
    {
      q: `What characters is ${w.name} best for?`,
      a: `${w.name} is best for ${bestChar} and other ${w.type} Resonators in Wuthering Waves. ${chars.length > 1 ? 'Top matches include ' + chars.map(c => c.name).join(', ') + '.' : ''} Check the Build Planner for stat comparisons.`
    },
    {
      q: `How do I get ${w.name} in Wuthering Waves?`,
      a: `${w.name} is obtained through the Weapon Convene (gacha) system. ${Number(w.rarity) >= 5 ? 'As a 5★ weapon, it appears on limited weapon banners and the standard weapon banner.' : 'It is available on all weapon banners and as a random drop from pulls.'}`
    },
    {
      q: `What weapons are similar to ${w.name}?`,
      a: `${w.name} is a ${stars(w.rarity)} ${w.type} with Base ATK ${w.base_atk} and ${w.substat} ${w.substat_val}. ${simNames ? 'Compare with similar ' + w.type.toLowerCase() + 's: ' + simNames + '.' : ''} Visit the Weapons page to filter by type and rarity.`
    }
  ];

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
    }))
  });
}

// FAQPage for echoes (if missing)
function echoFAQSchema(e) {
  const chars = charsForEcho(e.slug);
  const bestChar = chars.length > 0 ? chars[0].name : 'matching element Resonators';

  const faqs = [
    {
      q: `What is the best character for ${e.name} in Wuthering Waves?`,
      a: `${e.name} is best for ${bestChar}. It provides the ${e.sonata_effect} Sonata Effect and its active skill, ${e.skill_name}, deals ${e.element} DMG with bonus effects.`
    },
    {
      q: `Where does ${e.name} drop?`,
      a: `${e.name} is a Cost ${e.cost} ${e.cost >= 4 ? '(Boss/Overlord)' : (e.cost >= 3 ? '(Elite)' : '(Common)')} echo that drops from ${e.element} Tacet Discords in the overworld and from Tacet Fields. Check the Interactive Map for exact farming locations.`
    },
    {
      q: `What Sonata set is ${e.name} in?`,
      a: `${e.name} belongs to the ${e.sonata_effect} set. Equip 5 ${e.sonata_effect} echoes to activate both the 2-piece and 5-piece set bonuses.`
    }
  ];

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
    }))
  });
}

// ── Schema injection helper ─────────────────────────────────
// Inject schema scripts right before <script src="/scripts/nav.js"
function injectSchema(html, schemaJSON) {
  const marker = '<script src="/scripts/nav.js" defer></script>';
  if (!html.includes(marker)) {
    // Fallback: inject before </head>
    if (html.includes('</head>')) {
      return html.replace('</head>', `\n<script type="application/ld+json">${schemaJSON}</script>\n</head>`);
    }
    return html;
  }
  return html.replace(marker, `<script type="application/ld+json">${schemaJSON}</script>\n${marker}`);
}

// Check if a schema type already exists on the page
function hasSchemaType(html, type) {
  return html.includes(`"@type":"${type}"`) || html.includes(`"@type": "${type}"`);
}

// ── Page processors ─────────────────────────────────────────

function processWeaponPage(filePath) {
  const slug = path.basename(path.dirname(filePath));
  const w = weaponData[slug];
  if (!w) { console.log(`  ⚠️  No data for weapon: ${slug}`); return false; }

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add FAQPage schema if missing
  if (!hasSchemaType(html, 'FAQPage')) {
    html = injectSchema(html, weaponFAQSchema(w));
    changed = true;
  }

  // Add BreadcrumbList schema if missing
  if (!hasSchemaType(html, 'BreadcrumbList')) {
    const breadcrumb = buildBreadcrumb([
      { name: 'WutZone', url: 'https://wutzone.com/' },
      { name: 'Weapons', url: 'https://wutzone.com/weapons/' },
      { name: w.name, url: `https://wutzone.com/weapons/${slug}/` }
    ]);
    html = injectSchema(html, breadcrumb);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  ✅ Weapon: ${w.name} (+schema)`);
  } else {
    console.log(`  ⏭️  Weapon: ${w.name} (already has schema)`);
  }
  return changed;
}

function processCharacterPage(filePath) {
  const slug = path.basename(path.dirname(filePath));
  if (slug.startsWith('category:')) return false;
  const c = charData[slug];
  if (!c) { console.log(`  ⚠️  No data for character: ${slug}`); return false; }

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add BreadcrumbList schema if missing
  if (!hasSchemaType(html, 'BreadcrumbList')) {
    const breadcrumb = buildBreadcrumb([
      { name: 'WutZone', url: 'https://wutzone.com/' },
      { name: 'Characters', url: 'https://wutzone.com/characters/' },
      { name: c.n, url: `https://wutzone.com/characters/${slug}/` }
    ]);
    html = injectSchema(html, breadcrumb);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  ✅ Character: ${c.n} (+breadcrumb)`);
  } else {
    console.log(`  ⏭️  Character: ${c.n} (already has breadcrumb)`);
  }
  return changed;
}

function processEchoPage(filePath) {
  const slug = path.basename(path.dirname(filePath));
  const e = echoData[slug];
  if (!e) { console.log(`  ⚠️  No data for echo: ${slug}`); return false; }

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add BreadcrumbList schema if missing
  if (!hasSchemaType(html, 'BreadcrumbList')) {
    const breadcrumb = buildBreadcrumb([
      { name: 'WutZone', url: 'https://wutzone.com/' },
      { name: 'Echoes', url: 'https://wutzone.com/echos/' },
      { name: e.name, url: `https://wutzone.com/echos/${slug}/` }
    ]);
    html = injectSchema(html, breadcrumb);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  ✅ Echo: ${e.name} (+breadcrumb)`);
  } else {
    console.log(`  ⏭️  Echo: ${e.name} (already has breadcrumb)`);
  }
  return changed;
}

// Build ItemList schema for a collection page
function buildItemList(pageTitle, pageUrl, items) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': pageTitle,
    'url': pageUrl,
    'numberOfItems': items.length,
    'itemListElement': items.map((item, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': item.name,
      'url': item.url
    }))
  });
}

// Build Article schema
function buildArticle(headline, description, url) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': headline,
    'description': description,
    'url': url,
    'datePublished': '2026-07-11',
    'dateModified': TODAY,
    'author': { '@type': 'Organization', 'name': 'WutZone' }
  });
}

// Build Organization schema
function buildOrgSchema() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'WutZone',
    'url': 'https://wutzone.com/',
    'description': 'Comprehensive Wuthering Waves guide and database — characters, weapons, echoes, tier list, build planner, and interactive map.',
    'foundingDate': '2025',
    'logo': 'https://wutzone.com/favicon.svg'
  });
}

function processListPages() {
  console.log('\n📋 List & Section pages:');
  let count = 0;

  // Helper: inject schema into an existing page
  function injectToPage(relPath, schema, label) {
    const fp = path.join(ROOT, relPath);
    if (!fs.existsSync(fp)) { console.log(`  ⚠️  Missing: ${relPath}`); return false; }
    let html = fs.readFileSync(fp, 'utf8');

    // Check if schema type already present
    const typeMatch = schema.match(/"@type":"(\w+)"/);
    if (typeMatch && hasSchemaType(html, typeMatch[1])) {
      console.log(`  ⏭️  ${label} (already has ${typeMatch[1]})`);
      return false;
    }

    html = injectSchema(html, schema);
    fs.writeFileSync(fp, html, 'utf8');
    console.log(`  ✅ ${label}`);
    return true;
  }

  // Characters index — ItemList
  const charItems = Object.entries(charData).map(([slug, c]) => ({
    name: `${c.n} (${stars(c.r)} ${c.e || ''} ${c.w || ''})`,
    url: `https://wutzone.com/characters/${slug}/`
  }));
  if (injectToPage('characters/index.html', buildItemList('Wuthering Waves Characters List', 'https://wutzone.com/characters/', charItems), 'characters/index.html (ItemList)')) count++;

  // Weapons index — ItemList
  const wepItems = Object.entries(weaponData).map(([slug, w]) => ({
    name: `${w.name} (${stars(w.rarity)} ${w.type})`,
    url: `https://wutzone.com/weapons/${slug}/`
  }));
  if (injectToPage('weapons/index.html', buildItemList('Wuthering Waves Weapons List', 'https://wutzone.com/weapons/', wepItems), 'weapons/index.html (ItemList)')) count++;

  // Echoes index — ItemList
  const echoItems = Object.entries(echoData).map(([slug, e]) => ({
    name: `${e.name} (Cost ${e.cost} ${e.element} — ${e.sonata_effect})`,
    url: `https://wutzone.com/echos/${slug}/`
  }));
  if (injectToPage('echos/index.html', buildItemList('Wuthering Waves Echoes List', 'https://wutzone.com/echos/', echoItems), 'echos/index.html (ItemList)')) count++;

  // Items index — ItemList (no structured item data, use minimal)
  const itemListSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Wuthering Waves Items Database',
    'url': 'https://wutzone.com/items/',
    'description': 'Complete Wuthering Waves items database — ascension materials, skill materials, weapon materials, and consumables.'
  });
  if (injectToPage('items/index.html', itemListSchema, 'items/index.html (ItemList)')) count++;

  // Article schemas for guide-style pages
  if (injectToPage('tier-list/index.html', buildArticle(
    'Wuthering Waves Tier List — Best Characters Ranked (2026)',
    'Data-driven Wuthering Waves tier list with S/A/B/C/D rankings for Main DPS, Sub-DPS, and Support roles. All Resonators ranked by verified stats and community consensus.',
    'https://wutzone.com/tier-list/'
  ), 'tier-list/index.html (Article)')) count++;

  if (injectToPage('build-planner/index.html', buildArticle(
    'Wuthering Waves Build Planner',
    'Interactive build planner for Wuthering Waves. Select a character, equip weapons and echoes, preview final stats. Save and share your builds.',
    'https://wutzone.com/build-planner/'
  ), 'build-planner/index.html (Article)')) count++;

  if (injectToPage('map/index.html', buildArticle(
    'Wuthering Waves Interactive Map — Bosses, Echoes & Resources',
    'Interactive Wuthering Waves map with boss locations, Echo farming spots, resource nodes, and Tacet Field markers.',
    'https://wutzone.com/map/'
  ), 'map/index.html (Article)')) count++;

  return count;
}

// ── Footer brand fix ────────────────────────────────────────
function fixFooterBrand() {
  console.log('\n🏷️  Fixing footer brand "Wuthering Waves Database" → "WutZone"...');
  let footerCount = 0;
  let schemaCount = 0;

  function fixFile(fp) {
    let html = fs.readFileSync(fp, 'utf8');
    let changed = false;

    // Fix footer copyright
    if (html.includes('Wuthering Waves Database. Not affiliated')) {
      html = html.replace(/Wuthering Waves Database\. Not affiliated/g, 'WutZone. Not affiliated');
      changed = true;
    }

    // Fix schema "name": "Wuthering Waves Database"
    if (html.includes('"name":"Wuthering Waves Database"')) {
      html = html.replace(/"name":"Wuthering Waves Database"/g, '"name":"WutZone"');
      changed = true;
    }

    // Fix schema Organization author name
    if (html.includes('"name":"Wuthering Waves Database"')) {
      html = html.replace(/"name":"Wuthering Waves Database"/g, '"name":"WutZone"');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(fp, html, 'utf8');
      return true;
    }
    return false;
  }

  function walkDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'data' && entry.name !== 'scripts' && entry.name !== 'fonts' && entry.name !== 'images' && !entry.name.startsWith('category:')) {
        walkDir(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.html')) {
        const fp = path.join(dir, entry.name);
        if (fixFile(fp)) footerCount++;
      }
    }
  }
  walkDir(ROOT);

  // Also check root-level .html files
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith('.html') && fixFile(path.join(ROOT, f))) footerCount++;
  }

  console.log(`  ✅ Fixed ${footerCount} pages`);
  return footerCount;
}

// ── Fix homepage schema + add Organization ──────────────────
function fixHomepage() {
  console.log('\n🏠 Fixing homepage schema...');
  const fp = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(fp, 'utf8');
  let changed = false;

  // Add Organization schema if missing
  if (!hasSchemaType(html, 'Organization')) {
    html = injectSchema(html, buildOrgSchema());
    changed = true;
    console.log('  ✅ Added Organization schema');
  } else {
    console.log('  ⏭️  Organization schema already present');
  }

  if (changed) {
    fs.writeFileSync(fp, html, 'utf8');
  }
  return changed;
}

// ── Update sitemap ──────────────────────────────────────────
function updateSitemap() {
  console.log('\n🗺️  Updating sitemap.xml...');
  const fp = path.join(ROOT, 'sitemap.xml');
  let sitemap = fs.readFileSync(fp, 'utf8');
  const oldDate = sitemap.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/);
  const oldDateStr = oldDate ? oldDate[1] : 'unknown';

  sitemap = sitemap.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${TODAY}</lastmod>`);
  fs.writeFileSync(fp, sitemap, 'utf8');
  console.log(`  ✅ Sitemap: ${oldDateStr} → ${TODAY}`);
  return true;
}

// ── Main ────────────────────────────────────────────────────
console.log('🔧 GEO Optimization Round 2 — 5-in-1\n');
console.log(`📅 Today: ${TODAY}\n`);

let totalChanged = 0;

// 1. Weapon pages — FAQPage + BreadcrumbList
console.log('⚔️  Weapon pages (FAQPage + BreadcrumbList):');
const wepPages = path.join(ROOT, 'weapons');
for (const dir of fs.readdirSync(wepPages)) {
  const fp = path.join(wepPages, dir, 'index.html');
  if (fs.existsSync(fp) && processWeaponPage(fp)) totalChanged++;
}

// 2. Character pages — BreadcrumbList
console.log('\n👤 Character pages (BreadcrumbList):');
const charPages = path.join(ROOT, 'characters');
for (const dir of fs.readdirSync(charPages)) {
  if (dir.startsWith('category:')) continue;
  const fp = path.join(charPages, dir, 'index.html');
  if (fs.existsSync(fp) && processCharacterPage(fp)) totalChanged++;
}

// 3. Echo pages — BreadcrumbList
console.log('\n🔮 Echo pages (BreadcrumbList):');
const echoPagesDir = path.join(ROOT, 'echos');
for (const dir of fs.readdirSync(echoPagesDir)) {
  const fp = path.join(echoPagesDir, dir, 'index.html');
  if (fs.existsSync(fp) && processEchoPage(fp)) totalChanged++;
}

// 4. List/section pages
totalChanged += processListPages();

// 5. Footer brand fix
totalChanged += fixFooterBrand();

// 6. Homepage Organization schema
fixHomepage();

// 7. Sitemap
updateSitemap();

console.log(`\n🎉 Done! ${totalChanged} pages optimized.\n`);
