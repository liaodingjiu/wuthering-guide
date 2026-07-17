/**
 * P1: Add "Why This Build" explanations to character pages.
 * Generates reasoning for weapon/echo/team recommendations.
 * Safe to re-run — checks for existing "why" section.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }

// ── Data ────────────────────────────────────────────────────
const charData = {};
const weaponData = {};
const echoData = {};
const teammates = readJSON(path.join(ROOT, 'data/teammates.json'));

// Load characters
const charDir = path.join(ROOT, 'data/characters');
for (const f of fs.readdirSync(charDir)) {
  if (!f.endsWith('.json')) continue;
  const raw = readJSON(path.join(charDir, f));
  if (!raw) continue;
  const d = {
    s: raw.s || raw.slug, n: raw.n || raw.name, r: raw.r || raw.rarity,
    e: raw.e || raw.attribute, w: raw.w || raw.weapon, cls: raw.cls,
    desc: raw.desc || raw.description, skills: raw.skills,
    recWeapon: raw.recWeapon, recEcho: raw.recEcho, recSet: raw.recSet
  };
  if (d.s && d.n && !d.s.startsWith('category:')) charData[d.s] = d;
}

// Load weapons
const wepDir = path.join(ROOT, 'data/weapons');
for (const f of fs.readdirSync(wepDir)) {
  if (!f.endsWith('.json')) continue;
  const d = readJSON(path.join(wepDir, f));
  if (d && d.slug) weaponData[d.slug] = d;
}

// Load echoes
const echoDir = path.join(ROOT, 'data/echos');
for (const f of fs.readdirSync(echoDir)) {
  if (!f.endsWith('.json')) continue;
  const d = readJSON(path.join(echoDir, f));
  if (d && d.slug) echoData[d.slug] = d;
}

// ── Helpers ─────────────────────────────────────────────────
function stars(n) { return '★'.repeat(Number(n) || 0); }
function slugify(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

function bestWeapon(c) {
  const matches = [];
  for (const [slug, w] of Object.entries(weaponData)) {
    if (w.type && c.w && w.type.toLowerCase() === c.w.toLowerCase()) {
      matches.push({ slug, ...w });
    }
  }
  matches.sort((a,b) => (b.rarity|0) - (a.rarity|0));
  return matches[0] || null;
}

function bestEcho(c) {
  const matches = [];
  for (const [slug, e] of Object.entries(echoData)) {
    if (e.element && c.e && e.element.toLowerCase() === c.e.toLowerCase() && e.cost >= 4) {
      matches.push({ slug, ...e });
    }
  }
  matches.sort((a,b) => (b.cost|0) - (a.cost|0));
  return matches[0] || null;
}

function getTeammates(charSlug) {
  const specific = (teammates && teammates.specific && teammates.specific[charSlug]) || [];
  if (specific.length > 0) return specific;
  return (teammates && teammates.default) || [];
}

// Sonata set descriptions
const SONATA_BONUS = {
  'Molten Rift': 'Fusion DMG +10% (2pc), +30% after Resonance Skill (5pc)',
  'Freezing Frost': 'Glacio DMG +10% (2pc), +30% after Basic Attack (5pc)',
  'Void Thunder': 'Electro DMG +10% (2pc), +30% after Heavy Attack (5pc)',
  'Sierra Gale': 'Aero DMG +10% (2pc), +30% after Intro Skill (5pc)',
  'Celestial Light': 'Spectro DMG +10% (2pc), +30% after Outro Skill (5pc)',
  'Sun-sinking Eclipse': 'Havoc DMG +10% (2pc), +30% after Basic/Heavy Attack (5pc)',
  'Rejuvenating Glow': 'Healing +10% (2pc), +15% team ATK after healing (5pc)',
  'Moonlit Clouds': 'Energy Regen +10% (2pc), +22.5% ATK for next character after Outro (5pc)',
  'Lingering Tunes': 'ATK +10% (2pc), further +30% ATK when staying on-field (5pc)',
};

// ── Content generator ───────────────────────────────────────
function generateWhySection(c) {
  const w = c.recWeapon ? weaponData[c.recWeapon] : bestWeapon(c);
  const e = c.recEcho ? echoData[c.recEcho] : bestEcho(c);
  const set = c.recSet || (e ? e.sonata_effect : null);
  const setBonus = SONATA_BONUS[set] || 'Matching elemental set bonus';
  const tm = getTeammates(c.s);

  // Weapon why
  let weaponWhy = '';
  if (w) {
    const statReason = w.substat.includes('CRIT')
      ? `${w.substat} is the highest-value DPS stat, multiplying all damage output.`
      : w.substat.includes('ATK')
      ? `${w.substat} directly scales ${c.n}'s damage, and the high base ATK of ${w.base_atk} provides a strong foundation.`
      : `${w.substat} complements ${c.n}'s kit and enhances overall combat effectiveness.`;
    weaponWhy = `<p style="font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:10px"><strong>Why ${w.name}:</strong> As a ${stars(w.rarity)} ${w.type}, ${w.name} is the optimal choice for ${c.n}. ${statReason} Its passive <em>"${w.passive_name}"</em> — ${w.passive_desc.toLowerCase()} — synergizes directly with ${c.n}'s playstyle.</p>`;
  }

  // Echo why
  let echoWhy = '';
  if (e) {
    echoWhy = `<p style="font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:10px"><strong>Why ${e.name}:</strong> As a Cost ${e.cost} ${e.element} Echo, ${e.name} provides the best active skill for ${c.n}. The <strong>${set}</strong> Sonata set (${setBonus}) directly amplifies ${c.n}'s ${c.e} damage output. Its skill <em>"${e.skill_name}"</em> — ${e.skill_desc.toLowerCase().substring(0,120)}... — adds valuable combat utility.</p>`;
  }

  // Team why
  let teamWhy = '<p style="font-size:14px;color:var(--text2);line-height:1.7"><strong>Why this team:</strong> ';
  if (tm.length > 0) {
    const parts = tm.map(t => `<strong>${t.slug.charAt(0).toUpperCase()+t.slug.slice(1)}</strong> (${t.role}): ${t.synergy}`);
    teamWhy += parts.join('. ') + '.';
  } else {
    teamWhy += `${c.n} benefits from a standard DPS + Sub-DPS + Support composition. Match elemental supports for resonance bonuses and use universal healers for sustain.`;
  }
  teamWhy += '</p>';

  const html = `
<div class="cd-section" id="why-build">
  <h2>💡 Why This Build Works</h2>
  <div style="padding:4px 0">
    ${weaponWhy}
    ${echoWhy}
    ${teamWhy}
  </div>
  <p style="font-size:12px;color:var(--text3);margin-top:8px;border-top:1px solid rgba(78,205,196,0.08);padding-top:10px">💡 <em>These recommendations are based on ${c.n}'s ${c.e} element, ${c.w} weapon type, and role. Use the <a href="/build-planner/editor.html?char=${c.s}" style="color:var(--green)">Build Planner →</a> to compare and preview before committing in-game resources.</em></p>
</div>`;

  return html;
}

// ── Page processor ──────────────────────────────────────────
function processCharacter(filePath) {
  const slug = path.basename(path.dirname(filePath));
  if (slug.startsWith('category:')) return false;
  const c = charData[slug];
  if (!c) { console.log(`  ⚠️  No data: ${slug}`); return false; }

  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('id="why-build"')) {
    console.log(`  ⏭️  ${c.n} (already has why section)`);
    return false;
  }

  const whySection = generateWhySection(c);

  // Inject after Recommended Build section
  if (html.includes('<h2>👥 Best Teammates</h2>')) {
    html = html.replace('<h2>👥 Best Teammates</h2>', whySection + '\n<h2>👥 Best Teammates</h2>');
  } else if (html.includes('<div class="cd-section"><h2>🛠️ Recommended Build</h2>')) {
    // Fallback: inject after the recommended build section closes
    html = html.replace('</div>\n<div class="cd-section">\n  <h2>👥 Best Teammates</h2>', '</div>\n' + whySection + '\n<div class="cd-section">\n  <h2>👥 Best Teammates</h2>');
  } else {
    // Inject before next-steps
    html = html.replace('<div class="next-steps">', whySection + '\n<div class="next-steps">');
  }

  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

// ── Main ────────────────────────────────────────────────────
console.log('🔧 P1: Adding "Why This Build" to character pages...\n');

let count = 0;
const charPages = path.join(ROOT, 'characters');
for (const dir of fs.readdirSync(charPages)) {
  if (dir.startsWith('category:')) continue;
  const fp = path.join(charPages, dir, 'index.html');
  if (fs.existsSync(fp) && processCharacter(fp)) {
    count++;
  }
}

console.log(`\n✅ Added "Why" sections to ${count} character pages\n`);
