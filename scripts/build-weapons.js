// Build weapon detail pages from data/weapons/*.json
const fs = require('fs');
const path = require('path');

const TYPE_ICONS = {Broadblade:'⚔️',Sword:'🗡️',Pistols:'🔫',Gauntlets:'🥊',Rectifier:'📿'};
const RARITY_STARS = {'5':'★★★★★','4':'★★★★','3':'★★★'};
const ELEM_ICONS = {Aero:'💨',Glacio:'❄️',Fusion:'🔥',Electro:'⚡',Spectro:'💡',Havoc:'💀'};

// Build reverse mapping: weapon slug → [{name, slug, element}]
let weaponChars = {};
const charDir = path.join(__dirname, '..', 'data', 'characters');
try {
  const charFiles = fs.readdirSync(charDir).filter(f => f.endsWith('.json'));
  charFiles.forEach(f => {
    const c = JSON.parse(fs.readFileSync(path.join(charDir, f), 'utf8'));
    if (c.recWeapon) {
      if (!weaponChars[c.recWeapon]) weaponChars[c.recWeapon] = [];
      weaponChars[c.recWeapon].push({n: c.name||c.n, s: c.s||c.slug, e: c.e});
    }
  });
} catch(e) { console.log('No character data for weapon cross-links'); }

function rarityClass(r) { return r==='5'?'r-5':r==='4'?'r-4':'r-3'; }
function rarityBg(r) { return r==='5'?'rgba(250,204,21,0.15)':r==='4'?'rgba(192,132,252,0.15)':'rgba(96,165,250,0.15)'; }
function rarityColor(r) { return r==='5'?'#facc15':r==='4'?'#c084fc':'#60a5fa'; }

function weaponDetailPage(w) {
  const icon = TYPE_ICONS[w.type] || '⚔️';
  const stars = RARITY_STARS[w.rarity] || '';
  const rBg = rarityBg(w.rarity);
  const rColor = rarityColor(w.rarity);
  const descSnippet = w.passive_desc.replace(/"/g,'&quot;').substring(0,120);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${w.name} — ${w.type} | Wuthering Waves Database</title>
<meta name="description" content="${w.name} — ${stars} ${w.type}. Base ATK ${w.base_atk}, substat ${w.substat} ${w.substat_val}. ${w.passive_name}: ${descSnippet}...">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://wutzone.com/weapons/${w.slug}/">
<meta property="og:title" content="${w.name} — Wuthering Waves Weapon">
<meta property="og:description" content="${stars} ${w.type}. Base ATK ${w.base_atk}, ${w.substat} ${w.substat_val}.">
<meta property="og:type" content="website"><meta property="og:url" content="https://wutzone.com/weapons/${w.slug}/">
<link rel="stylesheet" href="/shared.css">
<style>
.r-5{background:rgba(250,204,21,0.2);color:#facc15}.r-4{background:rgba(192,132,252,0.2);color:#c084fc}.r-3{background:rgba(96,165,250,0.2);color:#60a5fa}
.wd-top{display:flex;gap:28px;flex-wrap:wrap;margin-bottom:28px}
.wd-icon{width:120px;height:120px;border-radius:50%;background:${rBg};display:flex;align-items:center;justify-content:center;font-size:56px;border:3px solid ${rColor};flex-shrink:0}
.wd-info{flex:1;min-width:280px}
.wd-info h1{font-size:36px;font-weight:700;margin-bottom:4px}
.wd-info .wd-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.wd-badge{padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid}
.wd-badge.rarity{border-color:${rColor};color:${rColor};background:${rBg}}
.wd-badge.type{border-color:#4ECDC4;color:#4ECDC4;background:rgba(78,205,196,0.1)}
.wd-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:28px}
.wd-stat{background:var(--surface);border:1px solid rgba(78,205,196,0.15);border-radius:12px;padding:18px 20px;text-align:center}
.wd-stat .val{font-size:32px;font-weight:700;color:#4ECDC4}
.wd-stat .lbl{font-size:13px;color:var(--text2);margin-top:4px}
.wd-section{background:var(--surface);border:1px solid rgba(78,205,196,0.15);border-radius:12px;padding:22px;margin-bottom:18px}
.wd-section h2{font-size:20px;font-weight:600;margin-bottom:12px;color:#4ECDC4}
.wd-section .passive-name{font-size:17px;font-weight:600;margin-bottom:8px}
.wd-section .passive-desc{font-size:15px;color:var(--text2);line-height:1.7}
.wd-section .flavor{font-size:14px;color:var(--text3);font-style:italic;line-height:1.6}
.wd-back{margin-bottom:20px}
.wd-back a{color:#4ECDC4;text-decoration:none;font-size:15px}
.wd-back a:hover{text-decoration:underline}
.wd-best-row{display:flex;gap:8px;flex-wrap:wrap}
.wd-best-tag{display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500;color:#4ECDC4;background:rgba(78,205,196,0.08);border:1px solid rgba(78,205,196,0.2);text-decoration:none;transition:all .2s}
.wd-best-tag:hover{background:rgba(78,205,196,0.18);border-color:#4ECDC4}
@media(max-width:600px){.wd-icon{width:80px;height:80px;font-size:36px}.wd-info h1{font-size:26px}}
</style>
</head>
<body>
<div class="top-bar">📊 Wuthering Waves Database — Data-driven, always up to date.</div>
<nav aria-label="Main navigation"><div class="nav-inner"><a href="/" class="logo">Wuthering<span>DB</span></a><div class="nav-right"><ul class="nav-links"><li><a href="/characters/">Characters</a></li><li><a href="/tier-list/">Tier List</a></li><li><a href="/echos/">Echoes</a></li><li><a href="/weapons/">Weapons</a></li><li class="nav-dropdown"><a>Database ▾</a><ul class="dropdown-menu"><li><a href="/items/">Items</a></li><li><a href="/skills/">Skills</a></li></ul></li><li><a href="/guide/">Guide</a></li><li><a href="/map/">Map</a></li><li><a href="/codes/">Codes</a></li><li><a href="/build-planner/" class="nav-highlight">Builder</a></li></ul><button class="theme-toggle">EN ▾</button></div></div></nav>

<main class="container" style="max-width:900px">

<div class="wd-back"><a href="/weapons/">← Back to Weapons</a></div>

<div class="wd-top">
<div class="wd-icon">${icon}</div>
<div class="wd-info">
<h1>${w.name}</h1>
<div class="wd-badges">
<span class="wd-badge rarity">${stars}</span>
<span class="wd-badge type">${icon} ${w.type}</span>
</div>
<div class="wd-stat"><div class="val">${w.base_atk}</div><div class="lbl">Base ATK (Lv.90)</div></div>
<div class="wd-stat"><div class="val">${w.substat_val}</div><div class="lbl">${w.substat}</div></div>
</div>

<div class="wd-section">
<h2>Weapon Skill</h2>
<div class="passive-name">${w.passive_name}</div>
<div class="passive-desc">${w.passive_desc}</div>
</div>
${w.description ? `<div class="wd-section"><h2>Description</h2><div class="flavor">${w.description}</div></div>` : ''}
${(weaponChars[w.slug]||[]).length > 0 ? '<div class="wd-section"><h2>👤 Best For</h2><div class="wd-best-row">'+weaponChars[w.slug].map(c => '<a href="/characters/'+c.s+'/" class="wd-best-tag">'+(ELEM_ICONS[c.e]||'👤')+' '+c.n+'</a>').join('')+'</div></div>' : ''}

</main>

<footer class="site-footer"><div class="footer-inner"><p>&copy; 2026 Wuthering Waves Database. Not affiliated with Kuro Games.</p><div class="footer-links"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/contact.html">Contact</a></div></div></footer>
</body>
</html>`;
}

const weaponDir = path.join(__dirname, '..', 'data', 'weapons');
const outBase = path.join(__dirname, '..', 'weapons');
const files = fs.readdirSync(weaponDir).filter(f => f.endsWith('.json'));

let count = 0;
files.forEach(f => {
  const w = JSON.parse(fs.readFileSync(path.join(weaponDir, f), 'utf8'));
  const dir = path.join(outBase, w.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'index.html'), weaponDetailPage(w));
  count++;
});

console.log('Generated ' + count + ' weapon detail pages');
