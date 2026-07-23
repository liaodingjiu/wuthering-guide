/**
 * SEO optimization script — 3-in-1:
 *   1. Titles: add intent keywords + shorten brand to WutZone
 *   2. Meta descriptions: lore → keyword-rich search-intent copy
 *   3. Weapon pages: add body content (best characters, how to get, similar weapons)
 *
 * Safe to re-run — idempotent replacements.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }

// ── Data index ──────────────────────────────────────────────
const charData = {};  // slug → { n, r, e, w, cls, desc, skills }
const weaponData = {}; // slug → { name, rarity, type, base_atk, substat, substat_val, passive_name, passive_desc }
const echoData = {};   // slug → { name, cost, element, sonata_effect, skill_name, skill_desc }
const itemRel = readJSON(path.join(ROOT, 'data/item-relations.json')); // item → [slugs]

// Load character data — normalise both JSON formats
// Format 1 (60 files): name, slug, rarity, attribute, weapon, cls, description, stats
// Format 2 (8 files):  n,    s,    r,      e,         w,      cls, desc, hp/atk/def/cr/cd/er, skills
const charDir = path.join(ROOT, 'data/characters');
for (const f of fs.readdirSync(charDir)) {
  if (!f.endsWith('.json')) continue;
  const raw = readJSON(path.join(charDir, f));
  if (!raw) continue;
  const d = {
    s: raw.s || raw.slug,
    n: raw.n || raw.name,
    r: raw.r || raw.rarity,
    e: raw.e || raw.attribute,
    w: raw.w || raw.weapon,
    cls: raw.cls,
    desc: raw.desc || raw.description,
    hp: raw.hp || (raw.stats && raw.stats.hp),
    atk: raw.atk || (raw.stats && raw.stats.atk),
    def: raw.def || (raw.stats && raw.stats.def),
    cr: raw.cr, cd: raw.cd, er: raw.er, skills: raw.skills
  };
  if (d.s && d.n) charData[d.s] = d;
}
// Load weapon data
const wepDir = path.join(ROOT, 'data/weapons');
for (const f of fs.readdirSync(wepDir)) {
  if (!f.endsWith('.json')) continue;
  const d = readJSON(path.join(wepDir, f));
  if (d && d.slug) weaponData[d.slug] = d;
}
// Load echo data
const echoDir = path.join(ROOT, 'data/echos');
for (const f of fs.readdirSync(echoDir)) {
  if (!f.endsWith('.json')) continue;
  const d = readJSON(path.join(echoDir, f));
  if (d && d.slug) echoData[d.slug] = d;
}

// ── Helpers ─────────────────────────────────────────────────
function stars(n) { return '★'.repeat(Number(n) || 0); }

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Find characters that use a weapon (by matching weapon type)
function charsForWeapon(wepSlug) {
  const w = weaponData[wepSlug];
  if (!w) return [];
  // Weapons don't have a character mapping directly, so match by type
  const results = [];
  for (const [slug, c] of Object.entries(charData)) {
    // weapon type match (Sword ↔ Sword, Gauntlets ↔ Gauntlets, etc.)
    if (c.w && c.w.toLowerCase() === w.type.toLowerCase()) {
      results.push({ slug, name: c.n, rarity: c.r });
    }
  }
  // Sort 5-star first, then alphabetically
  results.sort((a, b) => (b.rarity|0) - (a.rarity|0) || a.name.localeCompare(b.name));
  return results.slice(0, 5);
}

// Find the best weapon for a character (from build-recs or data)
const buildRecs = readJSON(path.join(ROOT, 'data/build-recs.js'));
// buildRecs might have recommendations

function bestWeaponForChar(charSlug) {
  // Simple heuristic: find weapons matching the character's weapon type, 5★ first
  const c = charData[charSlug];
  if (!c || !c.w) return [];
  const matches = [];
  for (const [slug, w] of Object.entries(weaponData)) {
    if (w.type && w.type.toLowerCase() === c.w.toLowerCase()) {
      matches.push({ slug, name: w.name, rarity: w.rarity });
    }
  }
  matches.sort((a, b) => (b.rarity|0) - (a.rarity|0));
  return matches.slice(0, 3);
}

function bestEchoesForChar(charSlug) {
  const c = charData[charSlug];
  if (!c || !c.e) return [];
  // Match by element
  const results = [];
  for (const [slug, e] of Object.entries(echoData)) {
    if (e.element && e.element.toLowerCase() === c.e.toLowerCase()) {
      results.push({ slug, name: e.name, cost: e.cost, sonata: e.sonata_effect });
    }
  }
  // Sort by cost desc (boss echoes first), then alphabetically
  results.sort((a, b) => (b.cost|0) - (a.cost|0) || a.name.localeCompare(b.name));
  return results.slice(0, 4);
}

// ── Title generators ────────────────────────────────────────
function newCharTitle(c) {
  const s = stars(c.r);
  return `${c.n} Build & Guide — Best Weapons, Echoes & Teams | WutZone`;
}

function newWeaponTitle(w) {
  const s = stars(w.rarity);
  return `${w.name} Guide — Stats, Best Characters & How to Get | WutZone`;
}

function newEchoTitle(e) {
  return `${e.name} Echo Guide — Best Characters, Sonata & Farm | WutZone`;
}

// ── Meta description generators ─────────────────────────────
function newCharMeta(c) {
  const s = stars(c.r);
  const weaponList = bestWeaponForChar(c.s);
  const bestWep = weaponList.length > 0 ? weaponList[0].name : 'best weapon';
  const elem = c.e || '';
  const wep = c.w || '';
  return `${c.n} is a ${s} ${elem} ${wep} Resonator in Wuthering Waves. Best build guide: ${bestWep}, optimal Echo sets, team comps, ascension materials & skill priority.`;
}

function newWeaponMeta(w) {
  const s = stars(w.rarity);
  const chars = charsForWeapon(w.slug);
  const charNames = chars.slice(0, 3).map(c => c.name).join(', ');
  return `${w.name} is a ${s} ${w.type} in Wuthering Waves — Base ATK ${w.base_atk}, ${w.substat} ${w.substat_val}. Best for ${charNames || 'matching Resonators'}. Stats, passive & comparison guide.`;
}

function newEchoMeta(e) {
  return `${e.name} is a Cost ${e.cost} ${e.element} Echo (${e.sonata_effect}) in Wuthering Waves. Best characters, farming locations, skill details & complete guide.`;
}

// ── Weapon body content generator ──────────────────────────
function weaponBodyContent(w) {
  const chars = charsForWeapon(w.slug);
  const charLinks = chars.map(c =>
    `<a href="/characters/${slugify(c.name)}/" class="wd-best-tag">${c.name} ${stars(c.rarity)}</a>`
  ).join('\n');

  const sameType = Object.entries(weaponData)
    .filter(([s, w2]) => w2.type === w.type && s !== w.slug)
    .sort((a, b) => (b[1].rarity|0) - (a[1].rarity|0))
    .slice(0, 4);
  const similarLinks = sameType.map(([s, w2]) =>
    `<a href="/weapons/${s}/" class="wd-best-tag">${w2.name} ${stars(w2.rarity)}</a>`
  ).join('\n');

  return `
<div class="wd-section" id="best-characters">
  <h2>🎯 Best Characters for ${w.name}</h2>
  <p style="font-size:14px;color:var(--text2);margin-bottom:12px">${w.name} works best on ${w.type} Resonators. Here are the top matches:</p>
  <div class="wd-best-row">${charLinks || '<span style="color:var(--text3)">Any ' + w.type + ' Resonator</span>'}</div>
</div>

<div class="wd-section" id="how-to-get">
  <h2>🗺️ How to Get ${w.name}</h2>
  <div style="font-size:15px;color:var(--text2);line-height:1.8">
    <p>${w.name} can be obtained through the <strong>Weapon Convene (Gacha)</strong> system. ${w.rarity >= 5 ? 'As a 5★ weapon, it appears on limited weapon banners and the standard weapon banner.' : 'It is available on all weapon banners and as a random drop from pulls.'}</p>
    <p>💡 <strong>Tip:</strong> Compare ${w.name} with similar ${w.type.toLowerCase()} weapons before committing upgrade materials. Check the <a href="/build-planner/" style="color:var(--green)">Build Planner →</a> to preview stats on specific characters.</p>
  </div>
</div>

<div class="wd-section" id="similar-weapons">
  <h2>⚔️ Similar ${w.type} Weapons</h2>
  <p style="font-size:14px;color:var(--text2);margin-bottom:12px">Compare ${w.name} with other ${w.type.toLowerCase()} options:</p>
  <div class="wd-best-row">${similarLinks || '<span style="color:var(--text3)">No similar weapons found</span>'}</div>
</div>
`;
}

// ── Replace helpers ─────────────────────────────────────────
function replaceTag(html, tag, newContent) {
  // Replace <tag>...</tag>
  const re = new RegExp(`<${tag}>[^<]*</${tag}>`, 'i');
  return html.replace(re, `<${tag}>${newContent}</${tag}>`);
}

function replaceMetaContent(html, name, newContent) {
  // <meta name="description" content="...">
  // NOTE: Uses [^>]*> to match the full tag — handles cases where
  // unescaped quotes in the original content corrupted the HTML,
  // leaving orphan text between the content closing quote and >.
  const re = new RegExp(`<meta name="${name}" content="[^"]*"[^>]*>`, 'i');
  const repl = `<meta name="${name}" content="${escapeHTML(newContent)}">`;
  if (re.test(html)) {
    html = html.replace(re, repl);
  }
  return html;
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function replaceOgTag(html, prop, newContent) {
  // <meta property="og:title" content="...">
  // NOTE: Uses [^>]*> to match the full tag — handles cases where
  // unescaped quotes in the original content corrupted the HTML.
  const re = new RegExp(`<meta property="og:${prop}" content="[^"]*"[^>]*>`, 'i');
  if (re.test(html)) {
    return html.replace(re, `<meta property="og:${prop}" content="${escapeHTML(newContent)}">`);
  }
  return html;
}

// ── Page processors ─────────────────────────────────────────

function processCharacterPage(filePath) {
  const slug = path.basename(path.dirname(filePath));
  const c = charData[slug];
  if (!c) { console.log(`  ⚠️  No data for character: ${slug}`); return false; }

  let html = fs.readFileSync(filePath, 'utf8');
  const changed = false;

  // Title
  const newTitle = newCharTitle(c);
  html = replaceTag(html, 'title', newTitle);

  // Meta description
  const newMeta = newCharMeta(c);
  html = replaceMetaContent(html, 'description', newMeta);

  // OG tags
  html = replaceOgTag(html, 'title', `${c.n} Build & Guide — WutZone`);
  html = replaceOgTag(html, 'description', newMeta.substring(0, 150));

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ✅ Character: ${c.n}`);
  return true;
}

function processWeaponPage(filePath) {
  const slug = path.basename(path.dirname(filePath));
  const w = weaponData[slug];
  if (!w) { console.log(`  ⚠️  No data for weapon: ${slug}`); return false; }

  let html = fs.readFileSync(filePath, 'utf8');

  // Title
  html = replaceTag(html, 'title', newWeaponTitle(w));

  // Meta description
  const newMeta = newWeaponMeta(w);
  html = replaceMetaContent(html, 'description', newMeta);

  // OG tags
  html = replaceOgTag(html, 'title', `${w.name} Guide — WutZone`);
  html = replaceOgTag(html, 'description', newMeta.substring(0, 150));

  // ── Add body content (only if not already present) ──
  if (!html.includes('id="best-characters"')) {
    const bodySection = weaponBodyContent(w);
    // Insert before the "next-steps" div or before </main>
    if (html.includes('<div class="next-steps">')) {
      html = html.replace('<div class="next-steps">', bodySection + '\n<div class="next-steps">');
    } else {
      html = html.replace('</main>', bodySection + '\n</main>');
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ✅ Weapon: ${w.name} (+body)`);
  return true;
}

function processEchoPage(filePath) {
  const slug = path.basename(path.dirname(filePath));
  const e = echoData[slug];
  if (!e) { console.log(`  ⚠️  No data for echo: ${slug}`); return false; }

  let html = fs.readFileSync(filePath, 'utf8');

  // Title
  html = replaceTag(html, 'title', newEchoTitle(e));

  // Meta description
  const newMeta = newEchoMeta(e);
  html = replaceMetaContent(html, 'description', newMeta);

  // OG tags
  html = replaceOgTag(html, 'title', `${e.name} Echo Guide — WutZone`);
  html = replaceOgTag(html, 'description', newMeta.substring(0, 150));

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ✅ Echo: ${e.name}`);
  return true;
}

function processIndexPage(filePath, newTitle, newMeta, ogTitle, ogDesc) {
  let html = fs.readFileSync(filePath, 'utf8');

  html = replaceTag(html, 'title', newTitle);
  html = replaceMetaContent(html, 'description', newMeta);
  if (ogTitle) html = replaceOgTag(html, 'title', ogTitle);
  if (ogDesc) html = replaceOgTag(html, 'description', ogDesc);

  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

// ── Brand replacement in top-bar ────────────────────────────
function replaceTopBarBrand(html) {
  return html.replace(
    /Wuthering Waves Database — Data-driven, always up to date\./g,
    'WutZone — Wuthering Waves Guide & Database'
  );
}

// ── Main ────────────────────────────────────────────────────
console.log('🔧 SEO Optimization — 3-in-1\n');

let count = 0;

// 1. Character pages (skip category:*)
console.log('📋 Character pages:');
const charPages = path.join(ROOT, 'characters');
for (const dir of fs.readdirSync(charPages)) {
  if (dir.startsWith('category:')) continue;
  const fp = path.join(charPages, dir, 'index.html');
  if (fs.existsSync(fp) && processCharacterPage(fp)) count++;
}

// 2. Weapon pages
console.log('\n⚔️  Weapon pages:');
const wepPages = path.join(ROOT, 'weapons');
for (const dir of fs.readdirSync(wepPages)) {
  const fp = path.join(wepPages, dir, 'index.html');
  if (fs.existsSync(fp) && processWeaponPage(fp)) count++;
}

// 3. Echo pages
console.log('\n🔮 Echo pages:');
const echoPages = path.join(ROOT, 'echos');
for (const dir of fs.readdirSync(echoPages)) {
  const fp = path.join(echoPages, dir, 'index.html');
  if (fs.existsSync(fp) && processEchoPage(fp)) count++;
}

// 4. Section index pages
console.log('\n📄 Section index pages:');
const sections = [
  { path: 'index.html', title: 'Wuthering Waves Guide & Database — Characters, Builds & Tier List | WutZone', meta: 'Comprehensive Wuthering Waves guide & database — 45+ Resonators, weapons, Echoes, tier list, build planner, and interactive map. All data-driven and up to date.', ogTitle: 'Wuthering Waves Guide & Database — WutZone', ogDesc: '45+ characters, weapons, echoes, tier list, and build planner.' },
  { path: 'characters/index.html', title: 'Wuthering Waves Characters — All Resonators List & Guide | WutZone', meta: 'All 45 Wuthering Waves Resonators with rarity, element, weapon type, class, and detailed stats. Search, filter, find builds & team comps for every character.', ogTitle: 'Wuthering Waves Characters — WutZone', ogDesc: '45+ Resonators with stats, builds, and team comps.' },
  { path: 'tier-list/index.html', title: 'Wuthering Waves Tier List — Best Characters Ranked (2026) | WutZone', meta: 'Data-driven Wuthering Waves tier list — S/A/B/C/D rankings for Main DPS, Sub-DPS, and Support. All Resonators ranked by verified stats and community consensus.', ogTitle: 'Wuthering Waves Tier List — WutZone', ogDesc: 'Best characters ranked by stats and community consensus.' },
  { path: 'weapons/index.html', title: 'Wuthering Waves Weapons List — All Weapons Guide & Stats | WutZone', meta: 'All Wuthering Waves weapons with base ATK, substats, and passive effects. Search, filter by type and rarity, and find the best weapon for every Resonator.', ogTitle: 'Wuthering Waves Weapons — WutZone', ogDesc: 'All weapons with stats, passives, and best character matches.' },
  { path: 'echos/index.html', title: 'Wuthering Waves Echoes List — All Echoes Guide & Sonata Effects | WutZone', meta: 'All Wuthering Waves echoes with sonata effects, costs, elements, and active skills. Search, filter, and find the best echo for your Resonator build.', ogTitle: 'Wuthering Waves Echoes — WutZone', ogDesc: 'All echoes with sonata effects and best character matches.' },
  { path: 'items/index.html', title: 'Wuthering Waves Items — Materials, Consumables & Farming Guide | WutZone', meta: 'Complete Wuthering Waves items database — ascension materials, skill materials, weapon materials, consumables. See which characters use each item and where to farm them.', ogTitle: 'Wuthering Waves Items — WutZone', ogDesc: 'All items with character usage and farming locations.' },
  { path: 'skills/index.html', title: 'Wuthering Waves Skills Guide — Combat System & Ability Types | WutZone', meta: 'Complete Wuthering Waves combat skills reference — learn how Basic Attacks, Resonance Skills, Resonance Liberation, Forte Circuits, and Outro Skills work. Master Concerto energy, dodge counters, and team rotations.', ogTitle: 'Wuthering Waves Skills Guide — WutZone', ogDesc: 'Combat skills, ability types, and team rotation mechanics.' },
  { path: 'build-planner/index.html', title: 'Wuthering Waves Build Planner — Create & Share Character Builds | WutZone', meta: 'Interactive build planner for Wuthering Waves. Select a character, equip weapons and echoes, preview final stats. Save and share your builds.', ogTitle: 'Wuthering Waves Build Planner — WutZone', ogDesc: 'Create and share character builds with stat previews.' },
  { path: 'guide/index.html', title: 'Wuthering Waves Guide — Gacha, Echo Farming, Teams & Progression | WutZone', meta: 'Complete Wuthering Waves guide covering the gacha and pity system, echo farming and substat rolling, combat mechanics, team building, daily routine, weapon progression, and ascension materials.', ogTitle: 'Wuthering Waves Guide — WutZone', ogDesc: 'Gacha system, echo farming, team building, and progression.' },
  { path: 'codes/index.html', title: 'Wuthering Waves Codes — Active Redemption Codes (July 2026) | WutZone', meta: 'All active Wuthering Waves redemption codes for July 2026 — free Astrite, Shell Credits, and resources. Copy codes with one click, learn how to redeem, and find official code sources. Updated weekly.', ogTitle: 'Wuthering Waves Codes — WutZone', ogDesc: 'Active redemption codes for free Astrite and resources.' },
  { path: 'map/index.html', title: 'Wuthering Waves Interactive Map — Bosses, Echoes & Resources | WutZone', meta: 'Interactive Wuthering Waves map with boss locations, Echo farming spots, resource nodes, and Tacet Field markers. Drag to explore, click for details.', ogTitle: 'Wuthering Waves Interactive Map — WutZone', ogDesc: 'Boss locations, Echo farming spots, and resource markers.' },
  { path: 'contact.html', title: 'Contact — WutZone | Wuthering Waves Guide', meta: 'Contact the WutZone team. Questions, corrections, or partnership inquiries about our Wuthering Waves database and guides.', ogTitle: 'Contact — WutZone', ogDesc: 'Get in touch with the WutZone team.' },
  { path: 'privacy.html', title: 'Privacy Policy — WutZone', meta: 'Privacy policy for WutZone — how we handle data, cookies, and third-party services on our Wuthering Waves guide website.', ogTitle: 'Privacy Policy — WutZone', ogDesc: 'How we handle data and cookies.' },
  { path: 'terms.html', title: 'Terms of Service — WutZone', meta: 'Terms of service for WutZone — usage guidelines and disclaimers for our Wuthering Waves database and guide website.', ogTitle: 'Terms of Service — WutZone', ogDesc: 'Usage guidelines and disclaimers.' },
];

for (const s of sections) {
  const fp = path.join(ROOT, s.path);
  if (fs.existsSync(fp)) {
    processIndexPage(fp, s.title, s.meta, s.ogTitle, s.ogDesc);
    console.log(`  ✅ ${s.path}`);
    count++;
  }
}

// 5. Update top-bar brand across ALL pages
console.log('\n🏷️  Updating top-bar brand...');
let brandCount = 0;
function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'data' && entry.name !== 'scripts' && entry.name !== 'fonts' && entry.name !== 'images' && !entry.name.startsWith('category:')) {
      walkDir(path.join(dir, entry.name));
    } else if (entry.name === 'index.html' || entry.name.endsWith('.html')) {
      const fp = path.join(dir, entry.name);
      let html = fs.readFileSync(fp, 'utf8');
      if (html.includes('Wuthering Waves Database — Data-driven, always up to date.')) {
        html = replaceTopBarBrand(html);
        fs.writeFileSync(fp, html, 'utf8');
        brandCount++;
      }
    }
  }
}
walkDir(ROOT);
console.log(`  ✅ Updated ${brandCount} pages`);

// 6. Update sitemap lastmod
console.log('\n🗺️  Updating sitemap.xml...');
const today = new Date().toISOString().split('T')[0];
let sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
sitemap = sitemap.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
console.log(`  ✅ Sitemap lastmod → ${today}`);

console.log(`\n🎉 Done! ${count} pages optimized.\n`);
