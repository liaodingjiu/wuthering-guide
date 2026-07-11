// Build character detail pages from data/characters/*.json
const fs = require('fs');
const path = require('path');

const ELEM_COLORS = {Aero:'#4ECDC4',Glacio:'#93c5fd',Fusion:'#f97316',Electro:'#c084fc',Spectro:'#facc15',Havoc:'#e879f9'};
const ELEM_ICONS = {Aero:'💨',Glacio:'❄️',Fusion:'🔥',Electro:'⚡',Spectro:'💡',Havoc:'💀'};
const WEP_ICONS = {Broadblade:'⚔️',Sword:'🗡️',Pistols:'🔫',Gauntlets:'🥊',Rectifier:'📿'};
const RARITY_STARS = {'5':'★★★★★','4':'★★★★','3':'★★★'};

function rarityColor(r) { return r==='5'?'#facc15':r==='4'?'#c084fc':r==='3'?'#60a5fa':'#6b7d94'; }
function rarityBg(r) { return r==='5'?'rgba(250,204,21,0.12)':r==='4'?'rgba(192,132,252,0.12)':r==='3'?'rgba(96,165,250,0.12)':'rgba(107,125,148,0.12)'; }

function charDetailPage(c) {
  const slug = c.s || c.slug || '';
  const name = c.name || c.n || '';
  const desc = c.desc || c.description || '';
  const icon = ELEM_ICONS[c.e] || '👤';
  const elColor = ELEM_COLORS[c.e] || '#4ECDC4';
  const rColor = rarityColor(c.r);
  const rBg = rarityBg(c.r);
  const stars = RARITY_STARS[c.r] || '';
  const wepIcon = WEP_ICONS[c.w] || '';

  const hasFullData = c.hp && c.skills;

  // Stats HTML
  let statsHtml = '';
  if (hasFullData) {
    const stats = [
      {v: c.hp.toLocaleString(), l: 'HP', c: '#22c55e'},
      {v: c.atk, l: 'ATK', c: '#ef4444'},
      {v: c.def, l: 'DEF', c: '#3b82f6'},
      {v: Math.round(c.cr*100)+'%', l: 'CRIT Rate', c: '#facc15'},
      {v: Math.round(c.cd*100)+'%', l: 'CRIT DMG', c: '#f97316'},
      {v: Math.round(c.er*100)+'%', l: 'Energy Regen', c: '#c084fc'}
    ];
    statsHtml = '<div class="cd-stats">' + stats.map(s =>
      '<div class="cd-stat"><div class="cd-stat-val" style="color:'+s.c+'">'+s.v+'</div><div class="cd-stat-lbl">'+s.l+'</div></div>'
    ).join('') + '</div>';
  }

  // Skills HTML — extract CD/Energy into tags
  let skillsHtml = '';
  if (hasFullData && c.skills) {
    const skillCards = c.skills.map(sk => {
      // Extract CD, Energy Cost, Duration from skill description
      const tags = [];
      const cdMatch = sk.d.match(/CD:\s*(\S+)/);
      const energyMatch = sk.d.match(/Energy(?: Cost)?:\s*(\S+)/);
      const durMatch = sk.d.match(/Duration:\s*(\S+)/);
      if (cdMatch) tags.push('⏱ CD '+cdMatch[1]);
      if (energyMatch) tags.push('⚡ Energy '+energyMatch[1]);
      if (durMatch) tags.push('⏳ '+durMatch[1]);
      const tagsHtml = tags.length > 0 ? '<div class="cd-skill-tags">'+tags.map(t => '<span class="cd-skill-tag">'+t+'</span>').join('')+'</div>' : '';
      return '<div class="cd-skill-card"><div class="cd-skill-header"><span class="cd-skill-type">'+sk.t+'</span></div><div class="cd-skill-name">'+sk.n+'</div>'+tagsHtml+'<div class="cd-skill-desc">'+sk.d+'</div></div>';
    }).join('');
    skillsHtml = '<div class="cd-section"><h2>⚔️ Skills</h2><div class="cd-skills-grid">'+skillCards+'</div></div>';
  }

  // Build recommendation HTML
  let buildHtml = '';
  if (hasFullData && c.recWeapon) {
    const wpnName = c.recWeapon.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
    const echoName = c.recEcho.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
    buildHtml = '<div class="cd-section"><h2>🛠️ Recommended Build</h2>'+
      '<div class="cd-build-row">'+
      '<a href="/weapons/'+c.recWeapon+'/" class="cd-build-item cd-build-link"><span class="cd-build-label">Best Weapon</span><span class="cd-build-val">'+wpnName+'</span></a>'+
      '<a href="/echos/'+c.recEcho+'/" class="cd-build-item cd-build-link"><span class="cd-build-label">Best Echo</span><span class="cd-build-val">'+echoName+'</span></a>'+
      '<div class="cd-build-item"><span class="cd-build-label">Sonata Set</span><span class="cd-build-val" style="color:'+elColor+'">'+c.recSet+'</span></div>'+
      '</div></div>';
  }

  // Meta robots for NPC pages
  const metaRobots = hasFullData ? 'index,follow' : 'noindex,follow';

  const descSnippet = (desc || c.n+' from Wuthering Waves.').substring(0, 140);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${name} — ${stars} ${c.e||''} ${c.w||''} | Wuthering Waves Database</title>
<meta name="description" content="${name} — ${stars} ${c.e||''} ${c.w||''} Resonator. ${descSnippet}">
<meta name="robots" content="${metaRobots}">
<link rel="canonical" href="https://wutzone.com/characters/${slug}/">
<meta property="og:title" content="${name} — Wuthering Waves Resonator">
<meta property="og:description" content="${stars} ${c.e||''} ${c.w||''}. ${descSnippet}">
<meta property="og:type" content="website"><meta property="og:url" content="https://wutzone.com/characters/${slug}/">
<link rel="stylesheet" href="/shared.css">
<style>
.cd-back{margin-bottom:20px}
.cd-back a{color:#4ECDC4;text-decoration:none;font-size:15px}
.cd-back a:hover{text-decoration:underline}
.cd-top{display:flex;gap:32px;flex-wrap:wrap;margin-bottom:28px}
.cd-icon-wrap{flex-shrink:0}
.cd-icon{width:160px;height:200px;border-radius:24px;background:${rBg};display:flex;align-items:center;justify-content:center;font-size:72px;border:3px solid ${rColor}}
.cd-info{flex:1;min-width:300px}
.cd-info h1{font-size:36px;font-weight:700;margin-bottom:6px}
.cd-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.cd-badge{padding:5px 14px;border-radius:20px;font-size:13px;font-weight:600;border:1.5px solid}
.cd-badge.rarity{border-color:${rColor};color:${rColor};background:${rBg}}
.cd-badge.element{border-color:${elColor};color:${elColor};background:rgba(${parseInt(elColor.slice(1,3),16)},${parseInt(elColor.slice(3,5),16)},${parseInt(elColor.slice(5,7),16)},0.08)}
.cd-badge.weapon{border-color:#4ECDC4;color:#4ECDC4;background:rgba(78,205,196,0.08)}
.cd-badge.cls{border-color:#6b7d94;color:#6b7d94;background:rgba(107,125,148,0.08)}
.cd-build-link{text-decoration:none;transition:all .25s ease;cursor:pointer}
.cd-build-link:hover{border-color:rgba(78,205,196,0.6);transform:translateY(-2px)}
.cd-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
.cd-stat{background:var(--surface);border:1px solid rgba(78,205,196,0.12);border-radius:10px;padding:14px 12px;text-align:center}
.cd-stat-val{font-size:24px;font-weight:700}
.cd-stat-lbl{font-size:11px;color:var(--text3);margin-top:4px;text-transform:uppercase;letter-spacing:.05em}
.cd-section{background:var(--surface);border:1px solid rgba(78,205,196,0.12);border-radius:12px;padding:22px;margin-bottom:16px}
.cd-section h2{font-size:18px;font-weight:600;margin-bottom:14px;color:#4ECDC4}
.cd-desc{font-size:15px;color:var(--text2);line-height:1.8}
.cd-skills-grid{display:flex;flex-direction:column;gap:10px}
.cd-skill-card{background:var(--bg);border:1px solid rgba(78,205,196,0.1);border-radius:10px;padding:16px;transition:all .2s}
.cd-skill-card:hover{border-color:rgba(78,205,196,0.3)}
.cd-skill-type{font-size:10px;color:${elColor};text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.cd-skill-name{font-size:15px;font-weight:600;margin:4px 0 6px}
.cd-skill-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.cd-skill-tag{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:rgba(78,205,196,0.1);color:#4ECDC4;border:1px solid rgba(78,205,196,0.2)}
.cd-skill-desc{font-size:13px;color:var(--text2);line-height:1.6}
.cd-build-row{display:flex;gap:12px;flex-wrap:wrap}
.cd-build-item{flex:1;min-width:140px;background:var(--bg);border-radius:10px;padding:16px;text-align:center;border:1px solid rgba(78,205,196,0.1)}
.cd-build-label{display:block;font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.cd-build-val{display:block;font-size:15px;font-weight:600;color:#4ECDC4}
.cd-minimal{text-align:center;padding:40px 20px;color:var(--text2)}
@media(max-width:768px){.cd-icon{width:100px;height:130px;font-size:48px}.cd-info h1{font-size:26px}.cd-stats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:480px){.cd-stats{grid-template-columns:repeat(2,1fr)}.cd-top{gap:16px}}
</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Who is ${name} in Wuthering Waves?","acceptedAnswer":{"@type":"Answer","text":"${name} is a ${stars} ${c.e||''} ${c.w||''} Resonator in Wuthering Waves. ${(desc||'').substring(0,200)}"}},{"@type":"Question","name":"What is the best weapon for ${name}?","acceptedAnswer":{"@type":"Answer","text":"The best weapon for ${name} is the ${c.recWeapon?c.recWeapon.replace(/-/g,' ').replace(/\\b\\w/g,l=>l.toUpperCase()):'weapon matching their type'}. Check our Build Planner for detailed weapon comparisons and stat calculations."}},{"@type":"Question","name":"What are the best Echoes for ${name}?","acceptedAnswer":{"@type":"Answer","text":"${name} benefits most from the ${c.recSet||'appropriate'} Sonata Effect set. Use a Cost 4 ${c.e||''} Echo as the main slot. Visit our Echoes page and Build Planner for full setup recommendations."}}]}</script>
</head>
<body>
<div class="top-bar">📊 Wuthering Waves Database — Data-driven, always up to date.</div>
<nav aria-label="Main navigation"><div class="nav-inner"><a href="/" class="logo">Wuthering<span>DB</span></a><div class="nav-right"><ul class="nav-links"><li><a href="/characters/">Characters</a></li><li><a href="/tier-list/">Tier List</a></li><li><a href="/echos/">Echoes</a></li><li><a href="/weapons/">Weapons</a></li><li class="nav-dropdown"><a>Database ▾</a><ul class="dropdown-menu"><li><a href="/items/">Items</a></li><li><a href="/skills/">Skills</a></li></ul></li><li><a href="/guide/">Guide</a></li><li><a href="/map/">Map</a></li><li><a href="/codes/">Codes</a></li><li><a href="/build-planner/" class="nav-highlight">Builder</a></li></ul><button class="theme-toggle">EN ▾</button></div></div></nav>

<main class="container" style="max-width:1000px">

<div class="cd-back"><a href="/characters/">← Back to Characters</a></div>

<div class="cd-top">
<div class="cd-icon-wrap"><div class="cd-icon">${icon}</div></div>
<div class="cd-info">
<h1>${name}</h1>
<div class="cd-badges">
<span class="cd-badge rarity">${stars}</span>
${c.e?('<span class="cd-badge element">'+icon+' '+c.e+'</span>'):''}
${c.w?('<span class="cd-badge weapon">'+wepIcon+' '+c.w+'</span>'):''}
${c.cls?('<span class="cd-badge cls">'+c.cls+'</span>'):''}
</div>
${desc?('<p class="cd-desc">'+desc+'</p>'):''}
${statsHtml}
</div></div>

${skillsHtml}
${buildHtml}

${!hasFullData?('<div class="cd-section cd-minimal"><p>📊 Detailed stats, skills, and build recommendations coming soon. Data being extracted from the wiki.</p></div>'):''}

</main>

<footer class="site-footer"><div class="footer-inner"><p>&copy; 2026 Wuthering Waves Database. Not affiliated with Kuro Games.</p><div class="footer-links"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/contact.html">Contact</a></div><p style="font-size:11px;color:var(--text3);margin-top:8px">Data from <a href="https://wutheringwaves.fandom.com" style="color:var(--text3)">wutheringwaves.fandom.com</a> (CC BY-SA 3.0). Game assets &copy; Kuro Technology Co., Ltd.</p></div></footer>
</body>
</html>`;
}

const charDir = path.join(__dirname, '..', 'data', 'characters');
const outBase = path.join(__dirname, '..', 'characters');
const files = fs.readdirSync(charDir).filter(f => f.endsWith('.json'));

let count = 0, fullCount = 0;
files.forEach(f => {
  const c = JSON.parse(fs.readFileSync(path.join(charDir, f), 'utf8'));
  const slug = c.s || c.slug;
  if (!slug) { console.log('Skipping file with no slug: ' + f); return; }
  const dir = path.join(outBase, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'index.html'), charDetailPage(c));
  count++;
  if (c.hp) fullCount++;
});

console.log('Generated ' + count + ' character detail pages (' + fullCount + ' with full data)');
