#!/usr/bin/env python3
"""Extract Wuthering Waves character data from Fandom wiki API.
Usage: python3 scripts/extract-characters.py
Uses HTTP to avoid SSL issues with fandom.com.
"""

import urllib.request
import json
import re
import os
import time
import glob

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, 'data', 'characters')
os.makedirs(DATA_DIR, exist_ok=True)

# Get character list
list_url = 'http://wutheringwaves.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Characters&cmlimit=500&format=json'
req = urllib.request.Request(list_url, headers={'User-Agent': 'WutherDB/1.0'})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read().decode('utf-8'))
members = data.get('query', {}).get('categorymembers', [])

# Filter out non-character pages (categories, templates, etc.)
char_names = []
for m in members:
    title = m['title'].strip('"')
    if ':' not in title and '/' not in title:
        char_names.append(title)

print(f'Found {len(char_names)} characters')

# Extract data from each character page
total = len(char_names)
updated = 0
new_chars = 0
errors = 0

for i, name in enumerate(char_names):
    slug = name.lower().replace(' ', '-').replace("'", '').replace('"', '')
    fp = os.path.join(DATA_DIR, f'{slug}.json')

    # Skip if already has complete data
    if os.path.exists(fp):
        existing = json.load(open(fp))
        if existing.get('attribute') and existing.get('rarity'):
            continue

    page = name.replace(' ', '_')
    try:
        api_url = f'http://wutheringwaves.fandom.com/api.php?action=parse&page={page}&format=json&prop=wikitext'
        req2 = urllib.request.Request(api_url, headers={'User-Agent': 'WutherDB/1.0'})
        resp2 = urllib.request.urlopen(req2, timeout=10)
        data2 = json.loads(resp2.read().decode('utf-8'))

        if 'parse' not in data2:
            continue

        wikitext = data2['parse']['wikitext']['*']

        char = {'name': name, 'slug': slug}

        # Extract fields from wikitext
        fields = {
            'rarity': r'rarity\s*=\s*(\d+)',
            'attribute': r'attribute\s*=\s*(\w+)',
            'weapon': r'weapon\s*=\s*(\w+)',
            'cls': r'class\s*=\s*(\w+)',
            'birthday': r'birthday\s*=\s*(.+?)(?:\n|\||\})',
            'birthplace': r'birthplace\s*=\s*(.+?)(?:\n|\||\})',
        }

        for field, pattern in fields.items():
            m = re.search(pattern, wikitext)
            if m:
                char[field] = m.group(1).strip()

        with open(fp, 'w') as f:
            json.dump(char, f, indent=2)

        if os.path.exists(fp):
            updated += 1
        else:
            new_chars += 1

        if char.get('rarity'):
            print(f'  [{i+1}/{total}] ★{char["rarity"]} {char.get("attribute","?"):10s} {name}')
    except urllib.error.HTTPError:
        errors += 1
    except Exception as e:
        errors += 1
        if errors <= 5:
            print(f'  [{i+1}/{total}] ERROR: {name} - {e}')

    # Rate limiting
    time.sleep(0.3)

    if (i + 1) % 50 == 0:
        print(f'  --- Progress: {i+1}/{total} ---')

# Summary
all_files = glob.glob(os.path.join(DATA_DIR, '*.json'))
all_chars = [json.load(open(f)) for f in all_files]

with_rarity = sum(1 for c in all_chars if c.get('rarity'))
with_attr = sum(1 for c in all_chars if c.get('attribute'))
with_weapon = sum(1 for c in all_chars if c.get('weapon'))
complete = sum(1 for c in all_chars if c.get('rarity') and c.get('attribute') and c.get('weapon'))

print(f'\n{"="*50}')
print(f'Done!')
print(f'Total files: {len(all_files)}')
print(f'With rarity: {with_rarity}')
print(f'With attribute: {with_attr}')
print(f'With weapon: {with_weapon}')
print(f'Complete (all 3): {complete}')
print(f'Errors: {errors}')

# Sample complete characters
complete_chars = [c for c in all_chars if c.get('rarity') and c.get('attribute')]
print(f'\nSample characters with full data:')
for c in sorted(complete_chars, key=lambda x: x['name'])[:10]:
    print(f'  ★{c["rarity"]} {c.get("attribute","?"):10s} {c.get("weapon","?"):12s} — {c["name"]}')
