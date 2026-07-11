// Build echo detail pages from data/echos/*.json
const fs = require('fs');
const path = require('path');

const ELEM_COLORS = {Aero:'#4ECDC4',Glacio:'#93c5fd',Fusion:'#f97316',Electro:'#c084fc',Spectro:'#facc15',Havoc:'#e879f9'};
const ELEM_ICONS = {Aero:'💨',Glacio:'❄️',Fusion:'🔥',Electro:'⚡',Spectro:'💡',Havoc:'💀'};
const SE_ICONS = {'Molten Rift':'🔥','Freezing Frost':'❄️','Void Thunder':'⚡','Sierra Gale':'💨','Celestial Light':'💡','Sun-sinking Eclipse':'💀','Rejuvenating Glow':'💚','Moonlit Clouds':'🌙','Lingering Tunes':'🎵'};

// Build reverse mapping: echo slug → [{name, slug, element}]
let echoChars = {};
const charDir = path.join(__dirname, '..', 'data', 'characters');
try {
  const charFiles = fs.readdirSync(charDir).filter(f => f.endsWith('.json'));
  charFiles.forEach(f => {
    const c = JSON.parse(fs.readFileSync(path.join(charDir, f), 'utf8'));
    if (c.recEcho) {
      if (!echoChars[c.recEcho]) echoChars[c.recEcho] = [];
      echoChars[c.recEcho].push({n: c.name||c.n, s: c.s||c.slug, e: c.e});
    }
  });
} catch(e) { console.log('No character data for echo cross-links'); }

function costColor(c) {
  const colors = {'4':'#facc15','3':'#c084fc','1':'#60a5fa'};
  return colors[String(c)] || '#4ECDC4';
}
function costBg(c) {
  const bgs = {'4':'rgba(250,204,21,0.15)','3':'rgba(192,132,252,0.15)','1':'rgba(96,165,250,0.15)'};
  return bgs[String(c)] || 'rgba(78,205,196,0.1)';
}

function echoDetailPage(e) {
  const icon = ELEM_ICONS[e.element] || '🔮';
  const elColor = ELEM_COLORS[e.element] || '#4ECDC4';
  const cColor = costColor(e.cost);
  const cBg = costBg(e.cost);
  const seIcon = SE_ICONS[e.sonata_effect] || '';
  const descSnippet = e.skill_desc.replace(/"/g,'&quot;').substring(0,120);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${e.name} — Echo | Wuthering Waves Database</title>
<meta name="description" content="${e.name} — Cost ${e.cost} ${e.element} Echo. ${e.sonata_effect}. Skill: ${e.skill_name} — ${descSnippet}...">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://wutzone.com/echos/${e.slug}/">
<meta property="og:title" content="${e.name} — Wuthering Waves Echo">
<meta property="og:description" content="Cost ${e.cost} ${e.element} Echo. ${e.sonata_effect}. Active Skill: ${e.skill_name}.">
<meta property="og:type" content="website"><meta property="og:url" content="https://wutzone.com/echos/${e.slug}/">
<link rel="stylesheet" href="/shared.css">
<style>
.echo-d-top{display:flex;gap:28px;flex-wrap:wrap;margin-bottom:28px}
.echo-d-icon{width:120px;height:120px;border-radius:50%;background:${cBg};display:flex;align-items:center;justify-content:center;font-size:56px;border:3px solid ${cColor};flex-shrink:0}
.echo-d-info{flex:1;min-width:280px}
.echo-d-info h1{font-size:36px;font-weight:700;margin-bottom:4px}
.echo-d-info .echo-d-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.echo-d-badge{padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid}
.echo-d-badge.cost{border-color:${cColor};color:${cColor};background:${cBg}}
.echo-d-badge.element{border-color:${elColor};color:${elColor};background:rgba(${parseInt(elColor.slice(1,3),16)},${parseInt(elColor.slice(3,5),16)},${parseInt(elColor.slice(5,7),16)},0.1)}
.echo-d-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:28px}
.echo-d-stat{background:var(--surface);border:1px solid rgba(78,205,196,0.15);border-radius:12px;padding:18px 20px;text-align:center}
.echo-d-stat .val{font-size:32px;font-weight:700;color:${elColor}}
.echo-d-stat .lbl{font-size:13px;color:var(--text2);margin-top:4px}
.echo-d-section{background:var(--surface);border:1px solid rgba(78,205,196,0.15);border-radius:12px;padding:22px;margin-bottom:18px}
.echo-d-section h2{font-size:20px;font-weight:600;margin-bottom:12px}
.echo-d-section .skill-name{font-size:17px;font-weight:600;margin-bottom:8px;color:#4ECDC4}
.echo-d-section .skill-desc{font-size:15px;color:var(--text2);line-height:1.7}
.echo-d-section .flavor{font-size:14px;color:var(--text3);font-style:italic;line-height:1.6}
.echo-d-back{margin-bottom:20px}
.echo-d-back a{color:#c084fc;text-decoration:none;font-size:15px}
.echo-d-back a:hover{text-decoration:underline}
.echo-best-row{display:flex;gap:8px;flex-wrap:wrap}
.echo-best-tag{display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500;color:#c084fc;background:rgba(192,132,252,0.08);border:1px solid rgba(192,132,252,0.2);text-decoration:none;transition:all .2s}
.echo-best-tag:hover{background:rgba(192,132,252,0.18);border-color:#c084fc}
@media(max-width:600px){.echo-d-icon{width:80px;height:80px;font-size:36px}.echo-d-info h1{font-size:26px}}
</style>
</head>
<body>
<div class="top-bar">📊 Wuthering Waves Database — Data-driven, always up to date.</div>
<nav aria-label="Main navigation"><div class="nav-inner"><a href="/" class="logo">Wuthering<span>DB</span></a><div class="nav-right"><ul class="nav-links"><li><a href="/characters/">Characters</a></li><li><a href="/tier-list/">Tier List</a></li><li><a href="/echos/">Echoes</a></li><li><a href="/weapons/">Weapons</a></li><li class="nav-dropdown"><a>Database ▾</a><ul class="dropdown-menu"><li><a href="/items/">Items</a></li><li><a href="/skills/">Skills</a></li></ul></li><li><a href="/guide/">Guide</a></li><li><a href="/map/">Map</a></li><li><a href="/codes/">Codes</a></li><li><a href="/build-planner/" class="nav-highlight">Builder</a></li></ul><button class="theme-toggle">EN ▾</button></div></div></nav>

<main class="container" style="max-width:900px">

<div class="echo-d-back"><a href="/echos/">← Back to Echoes</a></div>

<div class="echo-d-top">
<div class="echo-d-icon">${icon}</div>
<div class="echo-d-info">
<h1>${e.name}</h1>
<div class="echo-d-badges">
<span class="echo-d-badge cost">Cost ${e.cost}</span>
<span class="echo-d-badge element">${icon} ${e.element}</span>
</div>
${e.description ? `<p style="color:var(--text2);font-size:15px;line-height:1.6">${e.description}</p>` : ''}
</div></div>

<div class="echo-d-stats">
<div class="echo-d-stat"><div class="val">${icon} ${e.element}</div><div class="lbl">Element</div></div>
<div class="echo-d-stat"><div class="val">${seIcon} ${e.sonata_effect}</div><div class="lbl">Sonata Effect</div></div>
</div>

<div class="echo-d-section">
<h2>Active Skill</h2>
<div class="skill-name">${e.skill_name}</div>
<div class="skill-desc">${e.skill_desc}</div>
</div>

<div class="echo-d-section">
<h2 style="color:${elColor}">Sonata Effect: ${seIcon} ${e.sonata_effect}</h2>
<div class="skill-desc" style="margin-top:8px">
${getSonataDescription(e.sonata_effect)}
</div>
</div>

${(echoChars[e.slug]||[]).length > 0 ? '<div class="echo-d-section"><h2>👤 Best For</h2><div class="echo-best-row">'+echoChars[e.slug].map(c => '<a href="/characters/'+c.s+'/" class="echo-best-tag">'+(ELEM_ICONS[c.e]||'👤')+' '+c.n+'</a>').join('')+'</div></div>' : ''}
${e.description ? `<div class="echo-d-section"><h2>Description</h2><div class="flavor">${e.description}</div></div>` : ''}

</main>

<footer class="site-footer"><div class="footer-inner"><p>&copy; 2026 Wuthering Waves Database. Not affiliated with Kuro Games.</p><div class="footer-links"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/contact.html">Contact</a></div></div></footer>
</body>
</html>`;
}

function getSonataDescription(se) {
  const descs = {
    'Molten Rift': '2-piece: Fusion DMG +10%.<br>5-piece: After casting Resonance Skill, Fusion DMG +30% for 15s.',
    'Freezing Frost': '2-piece: Glacio DMG +10%.<br>5-piece: After casting Basic Attack or Heavy Attack, Glacio DMG +10%. Upon dealing Glacio DMG to Frozen or Slowed enemies, increases CRIT Rate by 20% for 5s.',
    'Void Thunder': '2-piece: Electro DMG +10%.<br>5-piece: After casting Heavy Attack or Resonance Skill, Electro DMG +15%. Effect stacks up to 2 times, each lasts 15s.',
    'Sierra Gale': '2-piece: Aero DMG +10%.<br>5-piece: After casting Resonance Skill, Aero DMG +30% for 15s. After casting Intro Skill, Aero DMG +15% for 8s.',
    'Celestial Light': '2-piece: Spectro DMG +10%.<br>5-piece: After casting Intro Skill, Spectro DMG +30% for 15s.',
    'Sun-sinking Eclipse': '2-piece: Havoc DMG +10%.<br>5-piece: After casting Basic Attack or Heavy Attack, Havoc DMG +7.5%. Stacks up to 4 times, each lasts 15s.',
    'Rejuvenating Glow': '2-piece: Healing Bonus +10%.<br>5-piece: When healing allies, increases the entire party\'s ATK by 15% for 30s.',
    'Moonlit Clouds': '2-piece: Energy Regen +10%.<br>5-piece: After casting Outro Skill, increases the incoming Resonator\'s ATK by 22.5% for 15s.',
    'Lingering Tunes': '2-piece: ATK +10%.<br>5-piece: While on the field, ATK +5% every 1.5s. Stacks up to 4 times. Outro Skill DMG Bonus +60%.'
  };
  return descs[se] || 'Set bonus description coming soon.';
}

const echoDir = path.join(__dirname, '..', 'data', 'echos');
const outBase = path.join(__dirname, '..', 'echos');
const files = fs.readdirSync(echoDir).filter(f => f.endsWith('.json'));

let count = 0;
files.forEach(f => {
  const e = JSON.parse(fs.readFileSync(path.join(echoDir, f), 'utf8'));
  const dir = path.join(outBase, e.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'index.html'), echoDetailPage(e));
  count++;
});

console.log('Generated ' + count + ' echo detail pages');
