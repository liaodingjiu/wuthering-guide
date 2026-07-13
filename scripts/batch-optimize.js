// Batch optimization script — run once to update all weapon/echo/character detail pages
// Usage: node scripts/batch-optimize.js
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const CHARS_DIR = path.join(BASE, 'characters');
const WEAPONS_DIR = path.join(BASE, 'weapons');
const ECHOS_DIR = path.join(BASE, 'echos');

// ── Load data files ──
function loadArray(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/window\.\w+\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) { console.error('Cannot parse: ' + filePath); return []; }
  return eval(match[1]);
}

const CHARS = loadArray(path.join(CHARS_DIR, 'char-data.js'));
const WEAPONS = loadArray(path.join(WEAPONS_DIR, 'weapons-data.js'));
const ECHOES = loadArray(path.join(ECHOS_DIR, 'echos-data.js'));

const ELEM_ICONS = {Aero:'💨',Glacio:'❄️',Fusion:'🔥',Electro:'⚡',Spectro:'💡',Havoc:'💀',Multiple:'👤'};

function charBySlug(slug) { return CHARS.find(c => c.s === slug); }
function weaponBySlug(slug) { return WEAPONS.find(w => w.s === slug); }
function echoBySlug(slug) { return ECHOES.find(e => e.s === slug); }
function elemIcon(e) { return ELEM_ICONS[e] || '👤'; }

// ── Step 1: Extract build recommendations from character pages ──
console.log('Step 1: Extracting build recommendations from character pages...');
const buildRecs = {};

const charDirs = fs.readdirSync(CHARS_DIR).filter(f => {
  const p = path.join(CHARS_DIR, f);
  return fs.statSync(p).isDirectory() && !f.startsWith('category:');
});

charDirs.forEach(slug => {
  const htmlPath = path.join(CHARS_DIR, slug, 'index.html');
  if (!fs.existsSync(htmlPath)) return;
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Only extract from Recommended Build section
  const buildIdx = html.indexOf('Recommended Build');
  if (buildIdx === -1) return;
  const section = html.substring(buildIdx, buildIdx + 800);

  const weaponMatch = section.match(/\/weapons\/([^/"]+)\//);
  const echoMatch = section.match(/\/echos\/([^/"]+)\//);
  const sonataMatch = section.match(/Sonata Set<\/span><span[^>]*>([^<]+)<\/span>/);

  if (weaponMatch || echoMatch || sonataMatch) {
    buildRecs[slug] = {
      bestWeapon: weaponMatch ? weaponMatch[1] : null,
      bestEcho: echoMatch ? echoMatch[1] : null,
      sonata: sonataMatch ? sonataMatch[1] : null,
    };
    const c = charBySlug(slug);
    console.log(`  ${slug}: weapon=${buildRecs[slug].bestWeapon}, echo=${buildRecs[slug].bestEcho}, sonata=${buildRecs[slug].sonata} (${c ? c.n : '?'})`);
  }
});
console.log(`  Found ${Object.keys(buildRecs).length} characters with build recommendations`);

// ── Step 2: Build reverse indexes ──
console.log('Step 2: Building reverse indexes...');
const weaponToChars = {};
const echoToChars = {};

Object.entries(buildRecs).forEach(([charSlug, rec]) => {
  const c = charBySlug(charSlug);
  if (!c) return;
  const info = { slug: charSlug, name: c.n, icon: elemIcon(c.e), element: c.e };

  if (rec.bestWeapon) {
    if (!weaponToChars[rec.bestWeapon]) weaponToChars[rec.bestWeapon] = [];
    if (!weaponToChars[rec.bestWeapon].find(x => x.slug === charSlug))
      weaponToChars[rec.bestWeapon].push(info);
  }
  if (rec.bestEcho) {
    if (!echoToChars[rec.bestEcho]) echoToChars[rec.bestEcho] = [];
    if (!echoToChars[rec.bestEcho].find(x => x.slug === charSlug))
      echoToChars[rec.bestEcho].push(info);
  }
});

console.log(`  ${Object.keys(weaponToChars).length} weapons used by characters`);
console.log(`  ${Object.keys(echoToChars).length} echoes used by characters`);

// ── Step 3: Update weapon pages ──
console.log('Step 3: Updating weapon detail pages...');
let weaponCount = 0;

const weaponDirs = fs.readdirSync(WEAPONS_DIR).filter(f => {
  const p = path.join(WEAPONS_DIR, f);
  return fs.statSync(p).isDirectory();
});

weaponDirs.forEach(slug => {
  const htmlPath = path.join(WEAPONS_DIR, slug, 'index.html');
  if (!fs.existsSync(htmlPath)) return;
  let html = fs.readFileSync(htmlPath, 'utf8');

  if (html.includes('<h2>👤 Best For</h2>')) {
    console.log(`  ${slug}: already has Best For, skipping`);
    return;
  }

  const chars = weaponToChars[slug];
  if (!chars || chars.length === 0) return;

  const tags = chars.map(c =>
    `<a href="/characters/${c.slug}/" class="wd-best-tag">${c.icon} ${c.name}</a>`
  ).join('');
  const section = `\n<div class="wd-section"><h2>👤 Best For</h2><div class="wd-best-row">${tags}</div></div>`;

  html = html.replace('</main>', section + '\n\n</main>');
  fs.writeFileSync(htmlPath, html);
  console.log(`  ${slug}: added Best For → ${chars.map(c => c.name).join(', ')}`);
  weaponCount++;
});
console.log(`  Updated ${weaponCount} weapon pages`);

// ── Step 4: Update echo pages ──
console.log('Step 4: Updating echo detail pages...');
let echoCount = 0;

const echoDirs = fs.readdirSync(ECHOS_DIR).filter(f => {
  const p = path.join(ECHOS_DIR, f);
  return fs.statSync(p).isDirectory();
});

echoDirs.forEach(slug => {
  const htmlPath = path.join(ECHOS_DIR, slug, 'index.html');
  if (!fs.existsSync(htmlPath)) return;
  let html = fs.readFileSync(htmlPath, 'utf8');

  if (html.includes('<h2>👤 Best For</h2>')) {
    console.log(`  ${slug}: already has Best For, skipping`);
    return;
  }

  const chars = echoToChars[slug];
  if (!chars || chars.length === 0) return;

  const tags = chars.map(c =>
    `<a href="/characters/${c.slug}/" class="echo-best-tag">${c.icon} ${c.name}</a>`
  ).join('');
  const section = `\n<div class="echo-d-section"><h2>👤 Best For</h2><div class="echo-best-row">${tags}</div></div>`;

  html = html.replace('</main>', section + '\n\n</main>');
  fs.writeFileSync(htmlPath, html);
  console.log(`  ${slug}: added Best For → ${chars.map(c => c.name).join(', ')}`);
  echoCount++;
});
console.log(`  Updated ${echoCount} echo pages`);

// ── Step 5: Create build-recs.js ──
console.log('Step 5: Creating build-recs.js...');
const buildRecsData = {};
Object.entries(buildRecs).forEach(([charSlug, rec]) => {
  const c = charBySlug(charSlug);
  const w = rec.bestWeapon ? weaponBySlug(rec.bestWeapon) : null;
  const e = rec.bestEcho ? echoBySlug(rec.bestEcho) : null;
  buildRecsData[charSlug] = {
    n: c ? c.n : charSlug,
    bestWeapon: rec.bestWeapon,
    bestWeaponName: w ? w.n : (rec.bestWeapon || ''),
    bestEcho: rec.bestEcho,
    bestEchoName: e ? e.n : (rec.bestEcho || ''),
    sonata: rec.sonata || '',
  };
});

const js = '// Auto-generated build recommendations — character slug → optimal loadout\n' +
  'window.__BUILD_RECS__ = ' + JSON.stringify(buildRecsData, null, 2) + ';\n';

const dataDir = path.join(BASE, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
fs.writeFileSync(path.join(dataDir, 'build-recs.js'), js);
console.log(`  Written data/build-recs.js with ${Object.keys(buildRecsData).length} entries`);

console.log('\n✅ All done!');
console.log(`  Weapons updated: ${weaponCount}`);
console.log(`  Echoes updated: ${echoCount}`);
console.log(`  Build recs: ${Object.keys(buildRecsData).length}`);
