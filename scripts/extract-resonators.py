#!/usr/bin/env python3
"""Extract Wuthering Waves Resonator (playable character) data from Fandom."""
import urllib.request, json, re, time, os, glob

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, 'data', 'characters')
os.makedirs(DATA_DIR, exist_ok=True)

# Get all Resonators from Fandom
url = 'http://wutheringwaves.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Resonators&cmlimit=200&format=json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode('utf-8'))
members = [m['title'] for m in data.get('query', {}).get('categorymembers', []) if m['title'] != 'Resonator']
print(f'Resonators: {len(members)}')

updated = 0
errors = 0
for i, name in enumerate(members):
    slug = name.lower().replace(' ', '-').replace("'", "").replace('"', "")
    fp = os.path.join(DATA_DIR, slug + '.json')

    # Skip if already complete
    if os.path.exists(fp):
        existing = json.load(open(fp))
        if existing.get('rarity') and existing.get('attribute'):
            continue

    page = name.replace(' ', '_')
    try:
        api_url = 'http://wutheringwaves.fandom.com/api.php?action=parse&page=' + page + '&format=json&prop=wikitext'
        req2 = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
        resp2 = urllib.request.urlopen(req2, timeout=10)
        data2 = json.loads(resp2.read().decode('utf-8'))
        if 'parse' not in data2:
            continue
        wt = data2['parse']['wikitext']['*']

        char = {'name': name, 'slug': slug}
        for field, pattern in [
            ('rarity', r'rarity\s*=\s*(\d+)'),
            ('attribute', r'attribute\s*=\s*(\w+)'),
            ('weapon', r'weapon\s*=\s*(\w+)'),
            ('cls', r'class\s*=\s*(\w+)'),
        ]:
            m = re.search(pattern, wt)
            if m:
                char[field] = m.group(1).strip()

        with open(fp, 'w') as f:
            json.dump(char, f)
        updated += 1

        star = char.get('rarity', '?')
        attr = char.get('attribute', '?')
        if star != '?':
            print(f'  [{i+1}/{len(members)}] {star}star {attr} {name}')
    except Exception as e:
        errors += 1
        if errors <= 10:
            print(f'  [{i+1}/{len(members)}] ERR: {name}')
    time.sleep(0.3)

print(f'\nDone: {updated} updated, {errors} errors')

# Generate JS data
all_fp = glob.glob(os.path.join(DATA_DIR, '*.json'))
all_chars = []
for fp in all_fp:
    c = json.load(open(fp))
    if c.get('rarity'):
        all_chars.append(c)
all_chars.sort(key=lambda x: x['name'])

print(f'Playable characters with data: {len(all_chars)}')

js_data = [{
    's': c['slug'], 'n': c['name'],
    'r': c.get('rarity', '?'), 'e': c.get('attribute', ''),
    'w': c.get('weapon', ''), 'cls': c.get('cls', '')
} for c in all_chars]

js = 'window.__CHARS__ = ' + json.dumps(js_data, separators=(',', ':')) + ';'
js_file = os.path.join(BASE, 'characters', 'char-data.js')
with open(js_file, 'w') as f:
    f.write('// ' + str(len(js_data)) + ' playable characters from wutheringwaves.fandom.com\n' + js)
print(f'Saved char-data.js: {len(js_data)} characters')
