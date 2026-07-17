/**
 * P2: Generate "X vs Y" comparison pages.
 * Reddit-validated comparison topics with high search intent, low competition.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'compare');

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }
function stars(n) { return '★'.repeat(Number(n) || 0); }

// Load character data
const charData = {};
const charDir = path.join(ROOT, 'data/characters');
for (const f of fs.readdirSync(charDir)) {
  if (!f.endsWith('.json')) continue;
  const raw = readJSON(path.join(charDir, f));
  if (!raw) continue;
  const d = { s: raw.s || raw.slug, n: raw.n || raw.name, r: raw.r || raw.rarity,
    e: raw.e || raw.attribute, w: raw.w || raw.weapon, cls: raw.cls,
    desc: raw.desc || raw.description, hp: raw.hp || (raw.stats && raw.stats.hp),
    atk: raw.atk || (raw.stats && raw.stats.atk),
    def: raw.def || (raw.stats && raw.stats.def),
    cr: raw.cr, cd: raw.cd, er: raw.er,
    recWeapon: raw.recWeapon, recEcho: raw.recEcho, recSet: raw.recSet };
  if (d.s && d.n) charData[d.s] = d;
}

function getChar(slug) { return charData[slug] || null; }

function escapeHTML(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Comparison definitions ──────────────────────────────────
const COMPARISONS = [
  {
    slug: 'shorekeeper-vs-verina',
    title: 'Shorekeeper vs Verina — Best Healer Comparison | WutZone',
    meta: 'Compare Shorekeeper and Verina side-by-side — healing output, buff strength, rotation speed, team fit. Which support should you build first? Data-driven comparison.',
    charA: 'shorekeeper',
    charB: 'verina',
    category: 'Support',
    intro: 'Shorekeeper and Verina are the two best supports in Wuthering Waves. Both provide healing and team-wide buffs, but they excel in different areas. This comparison helps you decide which to prioritize for your account.',
    sections: [
      { heading: 'Buff Comparison', a: 'Crit Rate + Crit DMG buffs for the entire team. Higher damage ceiling for any DPS. Also provides DMG amplification and a one-time KO revive.', b: 'Universal ATK% buff that scales with her own ATK. Consistent and reliable, but lower ceiling than Shorekeeper\'s crit buffs. Team-wide healing on every Outro.', labelA: 'Shorekeeper', labelB: 'Verina' },
      { heading: 'Healing Output', a: 'Larger burst heals that can save a team from near-death. Synergizes with the 5pc Rejuvenating Glow set for maximum healing.', b: 'Consistent sustained healing. Less burst but more reliable over long fights. Easier to maintain full team HP without timing windows.', labelA: 'Shorekeeper', labelB: 'Verina' },
      { heading: 'Rotation Speed', a: 'Slightly longer field time to build Concerto. The extra seconds are worth the damage amplification she provides on Outro.', b: 'Fastest Concerto generation in the game. Minimal field time means more DPS uptime. Perfect for quick-swap teams that want to cycle rapidly.', labelA: 'Shorekeeper', labelB: 'Verina' },
      { heading: 'Team Flexibility', a: 'Fits 95% of all teams. Universal buffs work with any DPS element. The most future-proof support in the game as of 2026.', b: 'Also universal, but slightly less impactful buffs. Still top-tier and entirely free from the beginner selector. The best budget option for any account.', labelA: 'Shorekeeper', labelB: 'Verina' },
    ],
    verdict: '<strong>Pick Shorekeeper if</strong> you want the highest possible damage ceiling and plan to invest long-term. <strong>Pick Verina if</strong> you\'re F2P, want the fastest rotations, or need a second healer for your other ToA team. <strong>Ideally build both</strong> — they\'re the two best supports in the game and every account needs at least two healers for endgame content.',
    publisher: '2026-07-17',
    pageUrl: 'https://wutzone.com/compare/shorekeeper-vs-verina/'
  },
  {
    slug: 'carlotta-vs-augusta',
    title: 'Carlotta vs Augusta — Best Glacio DPS Comparison | WutZone',
    meta: 'Carlotta vs Augusta — compare damage output, team synergy, ease of play, and future value. Which Glacio DPS should you pull? Data-driven Wuthering Waves comparison.',
    charA: 'carlotta',
    charB: 'augusta',
    category: 'Main DPS',
    intro: 'Carlotta and Augusta are the two premier Glacio DPS options in Wuthering Waves. Carlotta excels at ranged single-target damage with a stylish, agile playstyle. Augusta offers comparable damage with better team utility through her DMG Amp Outro buff.',
    sections: [
      { heading: 'Damage Output', a: 'Higher raw single-target damage. Ranged attacks mean safer positioning and more consistent DPS uptime. Passive rewards precision play.', b: 'Slightly lower personal damage, but compensates with a 15% DMG Amp Outro buff that boosts the next resonator\'s damage. Better total team damage in quick-swap comps.', labelA: 'Carlotta', labelB: 'Augusta' },
      { heading: 'Team Synergy', a: 'Self-sufficient DPS that fits into any Glacio team. Doesn\'t buff teammates, so she\'s the "anchor" — your team builds around her, not the other way.', b: 'Outro provides 15% DMG Amp to the next resonator. Her time-stop mechanic works in timed modes. Better synergy with Iuno for future-proofing your account.', labelA: 'Carlotta', labelB: 'Augusta' },
      { heading: 'Ease of Play', a: 'Ranged, agile, and forgiving. Excellent for mobile players and those who prefer safer gameplay. Easy to pick up and perform well with immediately.', b: 'Requires managing the time-stop mechanic for maximum output. Higher skill ceiling but very rewarding when mastered. Better for experienced players.', labelA: 'Carlotta', labelB: 'Augusta' },
      { heading: 'Pull Value', a: 'Pull if you want the best solo Glacio DPS and prefer ranged/safe playstyles. She\'s the stronger standalone character.', b: 'Pull if you want team-wide value and plan to invest in Iuno later. Better long-term account value due to supporter-like Outro utility.', labelA: 'Carlotta', labelB: 'Augusta' },
    ],
    verdict: '<strong>Pick Carlotta if</strong> you want the highest personal DPS and a easy-to-play ranged carry. <strong>Pick Augusta if</strong> you value team synergy, want to future-proof with Iuno, and don\'t mind a higher skill ceiling. Both are excellent Glacio carries — the choice comes down to playstyle and team plans.',
    publisher: '2026-07-17',
    pageUrl: 'https://wutzone.com/compare/carlotta-vs-augusta/'
  },
  {
    slug: 'changli-vs-aemeath',
    title: 'Changli vs Aemeath — Best Fusion DPS Comparison | WutZone',
    meta: 'Changli vs Aemeath — compare Fusion DPS damage, team requirements, skill ceiling, and pull value. Which Fusion carry fits your account? Wuthering Waves comparison.',
    charA: 'changli',
    charB: 'aemeath',
    category: 'Main DPS',
    intro: 'Changli and Aemeath are the top Fusion DPS options. Changli is a quickswap swordswoman with high burst potential. Aemeath is a newer AoE-focused Fusion Broadblade user dominating Whimpering Wastes with Erosion mechanics.',
    sections: [
      { heading: 'Damage Profile', a: 'High burst damage through Resonance Skill spam and Phoenix mechanic. Excels in single-target and boss fights. 60% damage amp on max Blaze stacks enables massive nuke windows.', b: 'AoE-focused with Erosion mechanics that deal continuous damage. Dominates Whimpering Wastes and multi-enemy content. Higher sustained damage ceiling with ideal setup.', labelA: 'Changli', labelB: 'Aemeath' },
      { heading: 'Team Dependency', a: 'Flexible team options. Works well with universal supports like Shorekeeper/Verina. Her Outro buffs Fusion DMG and Resonance Skill DMG for the next resonator.', b: 'Needs Denia for optimal performance. Less flexible team-building but higher payoff when the dedicated support is available. More expensive to build the full team.', labelA: 'Changli', labelB: 'Aemeath' },
      { heading: 'Skill Ceiling', a: 'Higher skill ceiling — quickswap mechanics, stack management, and animation cancels. Skilled Changli players can push her far beyond her "on-paper" numbers.', b: 'Easier to play effectively. Erosion does work passively, and her AoE nature means less precision required. More consistent damage across player skill levels.', labelA: 'Changli', labelB: 'Aemeath' },
    ],
    verdict: '<strong>Pick Changli if</strong> you enjoy high-skill quickswap gameplay and want a flexible Fusion carry. <strong>Pick Aemeath if</strong> you have (or plan to get) Denia, prefer AoE content, and want a more forgiving playstyle. Changli rewards mastery; Aemeath delivers consistency.',
    publisher: '2026-07-17',
    pageUrl: 'https://wutzone.com/compare/changli-vs-aemeath/'
  },
  {
    slug: 'jinhsi-vs-cartethyia',
    title: 'Jinhsi vs Cartethyia — Spectro vs Aero DPS Face-off | WutZone',
    meta: 'Jinhsi vs Cartethyia — compare damage ceilings, team requirements, playstyle differences, and meta relevance. Wuthering Waves nuker vs AoE queen comparison.',
    charA: 'jinhsi',
    charB: 'cartethyia',
    category: 'Main DPS',
    intro: 'Jinhsi remains the biggest single-target nuke in the game, while Cartethyia has emerged as the AoE queen with her Aero Erosion mechanics. Both are top-tier, but they play very differently and fit different account needs.',
    sections: [
      { heading: 'Damage Ceiling', a: 'Still the biggest nuke in Wuthering Waves as of 2026. Incandescence stacks enable massive single-hit damage that can one-shot elite enemies. Excels in Tower of Adversity boss floors.', b: 'Best AoE DPS in the game. Erosion damage ticks continuously, making her the Whimpering Wastes queen. Lower single-target peak but higher total damage in multi-enemy scenarios.', labelA: 'Jinhsi', labelB: 'Cartethyia' },
      { heading: 'Team Requirements', a: 'Needs Spectro supports for resonance. Works well with Yinlin (off-field Electro + Res Skill buff) and universal healers. Pairs with Zhezhi for coordinated attacks.', b: 'Wants Ciaccona for optimal Aero synergy. Team building is more restrictive but the payoff in AoE content is massive. Aero resonance provides energy generation benefits.', labelA: 'Jinhsi', labelB: 'Cartethyia' },
      { heading: 'Investment Value', a: 'Aged like fine wine — still competitive two years after release. If you already have Jinhsi built, she remains a top-tier investment with no signs of falling off.', b: 'Newer character with potentially longer shelf life ahead. If starting fresh, Cartethyia is the stronger pick for modern content (Whimpering Wastes focus).', labelA: 'Jinhsi', labelB: 'Cartethyia' },
    ],
    verdict: '<strong>Pick Jinhsi if</strong> you want the safest investment — she\'s proven over two years and still a top nuker. <strong>Pick Cartethyia if</strong> you want the AoE meta queen and have (or plan to get) Ciaccona. Both are S-tier — Jinhsi for single-target, Cartethyia for multi-enemy content.',
    publisher: '2026-07-17',
    pageUrl: 'https://wutzone.com/compare/jinhsi-vs-cartethyia/'
  },
  {
    slug: 'camellya-vs-zani',
    title: 'Camellya vs Zani — Best Havoc DPS Comparison | WutZone',
    meta: 'Camellya vs Zani — compare Havoc DPS playstyles, team synergy, ease of use, and pull value. Should you pull Camellya or Zani? Wuthering Waves comparison guide.',
    charA: 'camellya',
    charB: 'zani',
    category: 'Main DPS',
    intro: 'Camellya and Zani are the top Havoc DPS options with very different playstyles. Camellya is a melee Sword user with Thorn stack mechanics and blooming strikes. Zani is a newer character with higher raw damage but stricter team requirements.',
    sections: [
      { heading: 'Damage Output', a: 'High burst damage through Thorn stacks and blooming strikes. Excels when you can stay on-field and build stacks methodically. Strong sustained damage with proper rotation.', b: 'Higher damage ceiling with ideal team (Phoebe or Spectro Rover required). Her kit is tuned for modern content and has a slightly higher numerical ceiling than Camellya.', labelA: 'Camellya', labelB: 'Zani' },
      { heading: 'Team Flexibility', a: 'Works well with universal supports. Sanhua is her best partner (Basic ATK buffer, fast rotations). Can slot into most teams without requiring specific limited 5-stars.', b: 'Needs Phoebe or Spectro Rover to function at full power. Less flexible but the Phoebe + Zani core is one of the strongest duos in the game when fully built.', labelA: 'Camellya', labelB: 'Zani' },
      { heading: 'Ease of Play', a: 'Straightforward playstyle — build stacks, unleash blooming strike. Melee range requires dodging skill but rewards aggressive play. Manageable skill floor.', b: 'Requires managing the team setup for maximum output. Higher investment floor (needs Phoebe) but more straightforward execution once the team is assembled.', labelA: 'Camellya', labelB: 'Zani' },
    ],
    verdict: '<strong>Pick Camellya if</strong> you want a self-sufficient Havoc DPS with flexible team options and proven reliability. <strong>Pick Zani if</strong> you have Phoebe (or plan to get her) and want the highest Havoc damage ceiling. Zani is the stronger pick for accounts that can afford her team requirements.',
    publisher: '2026-07-17',
    pageUrl: 'https://wutzone.com/compare/camellya-vs-zani/'
  }
];

// ── Page template ───────────────────────────────────────────
function generatePage(comp) {
  const cA = getChar(comp.charA);
  const cB = getChar(comp.charB);

  // Generate comparison table
  const tableRows = comp.sections.map(s => `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:14px 0;border-bottom:1px solid rgba(78,205,196,0.08)">
          <div>
            <div style="font-size:11px;color:var(--green);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${s.labelA}</div>
            <p style="font-size:14px;color:var(--text2);line-height:1.7;margin:0">${s.a}</p>
          </div>
          <div>
            <div style="font-size:11px;color:#facc15;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${s.labelB}</div>
            <p style="font-size:14px;color:var(--text2);line-height:1.7;margin:0">${s.b}</p>
          </div>
        </div>`).join('');

  const sectionsHTML = comp.sections.map(s => `
    <div class="vs-section">
      <h2>${s.heading}</h2>
      <div class="vs-compare-row">
        <div class="vs-col vs-col-a">
          <div class="vs-label">${s.labelA}</div>
          <p>${s.a}</p>
        </div>
        <div class="vs-col vs-col-b">
          <div class="vs-label vs-label-b">${s.labelB}</div>
          <p>${s.b}</p>
        </div>
      </div>
    </div>`).join('');

  const statsA = cA ? `<span class="vs-chip">${stars(cA.r)}</span><span class="vs-chip vs-chip-elem">${cA.e}</span><span class="vs-chip vs-chip-wpn">${cA.w}</span>` : '';
  const statsB = cB ? `<span class="vs-chip">${stars(cB.r)}</span><span class="vs-chip vs-chip-elem">${cB.e}</span><span class="vs-chip vs-chip-wpn">${cB.w}</span>` : '';

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': comp.title.replace(' | WutZone', ''),
    'description': comp.meta,
    'url': comp.pageUrl,
    'datePublished': comp.publisher,
    'dateModified': comp.publisher,
    'author': { '@type': 'Organization', 'name': 'WutZone' }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-D8SES2BJRL"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-D8SES2BJRL');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${escapeHTML(comp.title)}</title>
<meta name="description" content="${escapeHTML(comp.meta)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${comp.pageUrl}">
<meta property="og:title" content="${escapeHTML(comp.title.replace(' | WutZone',''))}">
<meta property="og:description" content="${escapeHTML(comp.meta.substring(0,150))}">
<meta property="og:type" content="article">
<meta property="og:url" content="${comp.pageUrl}">
<link rel="stylesheet" href="/shared.css">
<style>
.vs-hero{text-align:center;padding:36px 20px 12px}
.vs-hero h1{font-size:36px;font-weight:700}
.vs-hero .vs-sub{font-size:15px;color:var(--text2);max-width:700px;margin:10px auto 0;line-height:1.7}
.vs-chips{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px 0}
.vs-chip{padding:5px 16px;border-radius:20px;font-size:13px;font-weight:600;border:1.5px solid rgba(78,205,196,0.3);background:rgba(78,205,196,0.08);color:#4ECDC4}
.vs-chip-elem{color:#f97316;border-color:rgba(249,115,22,0.3);background:rgba(249,115,22,0.08)}
.vs-chip-wpn{color:#c084fc;border-color:rgba(192,132,252,0.3);background:rgba(192,132,252,0.08)}
.vs-section{background:var(--surface);border:1px solid rgba(78,205,196,0.1);border-radius:14px;padding:24px;margin-bottom:18px}
.vs-section h2{font-size:20px;font-weight:700;margin-bottom:16px;color:var(--text)}
.vs-compare-row{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.vs-col{padding:16px;border-radius:10px}
.vs-col-a{background:rgba(78,205,196,0.05);border:1px solid rgba(78,205,196,0.15)}
.vs-col-b{background:rgba(250,204,21,0.05);border:1px solid rgba(250,204,21,0.15)}
.vs-label{font-size:11px;color:var(--green);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;font-weight:700}
.vs-label-b{color:#facc15}
.vs-col p{font-size:14px;color:var(--text2);line-height:1.75;margin:0}
.vs-verdict{background:linear-gradient(135deg,rgba(78,205,196,0.08),rgba(250,204,21,0.06));border:1px solid rgba(78,205,196,0.2);border-radius:14px;padding:22px 24px;font-size:15px;color:var(--text2);line-height:1.8;margin:24px 0}
.vs-verdict strong{color:var(--text)}
.vs-nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}
.vs-nav a{font-size:13px;padding:6px 14px;border-radius:8px;border:1px solid rgba(78,205,196,0.2);color:var(--text2);text-decoration:none;transition:all .15s}
.vs-nav a:hover{border-color:rgba(78,205,196,0.5);color:#fff}
@media(max-width:768px){.vs-compare-row{grid-template-columns:1fr}.vs-hero h1{font-size:24px}}
</style>
<script type="application/ld+json">${schema}</script>
<script src="/scripts/nav.js" defer></script>
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "xkwf30ac3n");</script>
</head>
<body>
<div class="top-bar">📊 WutZone — Wuthering Waves Guide & Database</div>
<nav aria-label="Main navigation"><div class="nav-inner"><a href="/" class="logo">Wuthering<span>DB</span></a><div class="nav-right"><ul class="nav-links"><li><a href="/characters/">Characters</a></li><li><a href="/tier-list/">Tier List</a></li><li><a href="/echos/">Echoes</a></li><li><a href="/weapons/">Weapons</a></li><li class="nav-dropdown"><a>Database ▾</a><ul class="dropdown-menu"><li><a href="/items/">Items</a></li><li><a href="/skills/">Skills</a></li></ul></li><li><a href="/guide/">Guide</a></li><li><a href="/map/">Map</a></li><li><a href="/codes/">Codes</a></li><li><a href="/build-planner/" class="nav-highlight">Builder</a></li></ul><button class="theme-toggle">EN ▾</button></div></div></nav>

<main class="container" style="max-width:900px">

<header class="vs-hero">
  <h1>${comp.charA.charAt(0).toUpperCase()+comp.charA.slice(1)} vs ${comp.charB.charAt(0).toUpperCase()+comp.charB.slice(1)}</h1>
  <div class="vs-chips">
    ${statsA}
    <span style="font-size:18px;font-weight:700;color:var(--text3);align-self:center">VS</span>
    ${statsB}
  </div>
  <p class="vs-sub">${comp.intro}</p>
</header>

<section class="vs-section"><h2>📊 Side-by-Side Comparison</h2>${tableRows}</section>
${sectionsHTML}

<div class="vs-verdict">
  <h2 style="font-size:20px;font-weight:700;margin-bottom:10px;color:var(--text)">🏆 Verdict</h2>
  ${comp.verdict}
</div>

<nav class="vs-nav" aria-label="More comparisons">
  <strong style="color:var(--text2);align-self:center;font-size:13px">More Comparisons:</strong>
  <a href="/compare/shorekeeper-vs-verina/">Shorekeeper vs Verina</a>
  <a href="/compare/carlotta-vs-augusta/">Carlotta vs Augusta</a>
  <a href="/compare/changli-vs-aemeath/">Changli vs Aemeath</a>
  <a href="/compare/jinhsi-vs-cartethyia/">Jinhsi vs Cartethyia</a>
  <a href="/compare/camellya-vs-zani/">Camellya vs Zani</a>
</nav>

<div class="next-steps">
<h3>🔍 Continue Exploring</h3>
<div class="next-steps-grid">
<a href="/tier-list/" class="ns-card ns-gold">📊 Tier List →</a>
<a href="/characters/" class="ns-card ns-blue">👤 All Characters →</a>
<a href="/build-planner/" class="ns-card ns-purple">🛠️ Build Planner →</a>
<a href="/guide/" class="ns-card ns-green">📖 Game Guide →</a>
</div>
</div>

<div style="text-align:center;padding:8px 0 6px;font-size:12px;color:var(--text3)">📅 Updated: 2026-07-17</div>

</main>

<footer class="site-footer"><div class="footer-inner"><p>&copy; 2026 WutZone. Not affiliated with Kuro Games.</p><div class="footer-links"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></div></div></footer>
</body>
</html>`;
}

// ── Generate all comparison pages ───────────────────────────
console.log('🔧 P2: Creating comparison pages...\n');

for (const comp of COMPARISONS) {
  const dir = path.join(OUT_DIR, comp.slug);
  fs.mkdirSync(dir, { recursive: true });
  const html = generatePage(comp);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  console.log(`  ✅ ${comp.slug}`);
}

// ── Create comparison index page ────────────────────────────
const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-D8SES2BJRL"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-D8SES2BJRL');</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>Wuthering Waves Character Comparisons — X vs Y Guides | WutZone</title>
<meta name="description" content="Side-by-side Wuthering Waves character comparisons. Shorekeeper vs Verina, Carlotta vs Augusta, Changli vs Aemeath — data-driven guides to help you decide who to pull.">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://wutzone.com/compare/">
<meta property="og:title" content="Wuthering Waves Character Comparisons — WutZone">
<meta property="og:description" content="Side-by-side character comparisons to help you decide who to pull.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://wutzone.com/compare/">
<link rel="stylesheet" href="/shared.css">
<style>
.ch-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin:24px 0}
.ch-card{background:var(--surface);border:1px solid rgba(78,205,196,0.15);border-radius:14px;padding:22px;text-decoration:none;color:var(--text);transition:all .25s ease}
.ch-card:hover{border-color:rgba(78,205,196,0.5);transform:translateY(-2px)}
.ch-card h2{font-size:18px;font-weight:600;margin-bottom:6px}
.ch-card p{font-size:14px;color:var(--text2);line-height:1.6;margin:0}
.ch-hero{text-align:center;padding:36px 20px 12px}
.ch-hero h1{font-size:32px;font-weight:700}
.ch-hero .ch-sub{font-size:15px;color:var(--text2);max-width:680px;margin:8px auto 0;line-height:1.6}
</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","name":"Wuthering Waves Character Comparisons","url":"https://wutzone.com/compare/","numberOfItems":5,"itemListElement":[{"@type":"ListItem","position":1,"name":"Shorekeeper vs Verina","url":"https://wutzone.com/compare/shorekeeper-vs-verina/"},{"@type":"ListItem","position":2,"name":"Carlotta vs Augusta","url":"https://wutzone.com/compare/carlotta-vs-augusta/"},{"@type":"ListItem","position":3,"name":"Changli vs Aemeath","url":"https://wutzone.com/compare/changli-vs-aemeath/"},{"@type":"ListItem","position":4,"name":"Jinhsi vs Cartethyia","url":"https://wutzone.com/compare/jinhsi-vs-cartethyia/"},{"@type":"ListItem","position":5,"name":"Camellya vs Zani","url":"https://wutzone.com/compare/camellya-vs-zani/"}]}</script>
<script src="/scripts/nav.js" defer></script>
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "xkwf30ac3n");</script>
</head>
<body>
<div class="top-bar">📊 WutZone — Wuthering Waves Guide & Database</div>
<nav aria-label="Main navigation"><div class="nav-inner"><a href="/" class="logo">Wuthering<span>DB</span></a><div class="nav-right"><ul class="nav-links"><li><a href="/characters/">Characters</a></li><li><a href="/tier-list/">Tier List</a></li><li><a href="/echos/">Echoes</a></li><li><a href="/weapons/">Weapons</a></li><li class="nav-dropdown"><a>Database ▾</a><ul class="dropdown-menu"><li><a href="/items/">Items</a></li><li><a href="/skills/">Skills</a></li></ul></li><li><a href="/guide/">Guide</a></li><li><a href="/map/">Map</a></li><li><a href="/codes/">Codes</a></li><li><a href="/build-planner/" class="nav-highlight">Builder</a></li></ul><button class="theme-toggle">EN ▾</button></div></div></nav>

<main class="container" style="max-width:1000px">

<header class="ch-hero">
  <h1>Character <span style="color:#4ECDC4">Comparisons</span></h1>
  <p class="ch-sub">Side-by-side, data-driven comparisons of the most debated characters in Wuthering Waves. Based on community consensus, verified stats, and endgame performance.</p>
</header>

<div class="ch-grid">
  <a href="/compare/shorekeeper-vs-verina/" class="ch-card">
    <h2>💚 Shorekeeper vs Verina</h2>
    <p>Which support healer should you build first? Compare buffs, healing output, rotation speed, and team flexibility.</p>
  </a>
  <a href="/compare/carlotta-vs-augusta/" class="ch-card">
    <h2>❄️ Carlotta vs Augusta</h2>
    <p>Head-to-head Glacio DPS comparison. Damage output, team synergy, ease of play, and long-term pull value.</p>
  </a>
  <a href="/compare/changli-vs-aemeath/" class="ch-card">
    <h2>🔥 Changli vs Aemeath</h2>
    <p>Fusion DPS showdown. Quickswap burst vs AoE Erosion — which playstyle and team fit is right for you?</p>
  </a>
  <a href="/compare/jinhsi-vs-cartethyia/" class="ch-card">
    <h2>💡 Jinhsi vs Cartethyia</h2>
    <p>The veteran nuker vs the AoE newcomer. Single-target boss killer or multi-enemy wave clearer?</p>
  </a>
  <a href="/compare/camellya-vs-zani/" class="ch-card">
    <h2>💀 Camellya vs Zani</h2>
    <p>Havoc DPS face-off. Thorn-stacking melee vs team-dependent burst — which has more value for your account?</p>
  </a>
</div>

<div class="next-steps">
<h3>🔍 Explore More</h3>
<div class="next-steps-grid">
<a href="/tier-list/" class="ns-card ns-gold">📊 Tier List Rankings →</a>
<a href="/characters/" class="ns-card ns-blue">👤 All Characters →</a>
<a href="/build-planner/" class="ns-card ns-purple">🛠️ Build Planner →</a>
<a href="/guide/" class="ns-card ns-green">📖 Complete Guide →</a>
</div>
</div>

<div style="text-align:center;padding:8px 0 6px;font-size:12px;color:var(--text3)">📅 Updated: 2026-07-17</div>

</main>

<footer class="site-footer"><div class="footer-inner"><p>&copy; 2026 WutZone. Not affiliated with Kuro Games.</p><div class="footer-links"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></div></div></footer>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHTML, 'utf8');
console.log(`  ✅ compare/index.html (list page)`);
console.log(`\n✅ Created 6 comparison pages\n`);
