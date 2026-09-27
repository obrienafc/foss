// Copies brand icons from the Simple Icons package (CC0) into assets/icons/
// and records each service's icon and brand colour in data/services.json.
//
// Usage:
//   npm pack simple-icons && tar xzf simple-icons-*.tgz
//   node scripts/build-icons.mjs ./package
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const pkg = process.argv[2];
if (!pkg || !existsSync(join(pkg, 'data', 'simple-icons.json'))) {
  console.error('Pass the path to an unpacked simple-icons package.');
  process.exit(1);
}

// Services whose name differs from the Simple Icons title.
const MANUAL = {
  'Algolia DocSearch': 'algolia',
  'Atlassian Bamboo': 'bamboo',
  'Atlassian Confluence': 'confluence',
  'Atlassian Jira': 'jira',
  'Docker Sponsored Open Source': 'docker',
  'Fastly Fast Forward': 'fastly',
  'GitHub code scanning': 'github',
  'GitHub Pages': 'github', // the Pages icon is a wordmark
  'JetBrains IDEs': 'jetbrains',
  'OSS-Fuzz': 'google',
  'Open Source Collective': 'opencollective',
  'OpenShift': 'redhatopenshift',
  'Semaphore': 'semaphoreci',
  'Scrutinizer': 'scrutinizerci',
};

// Titles that match a different brand with the same name.
const EXCLUDE = new Set(['Argos']); // Simple Icons' Argos is the UK retailer, not Argos CI

const root = new URL('..', import.meta.url).pathname;
const dataPath = join(root, 'data', 'services.json');
const outDir = join(root, 'assets', 'icons');
mkdirSync(outDir, { recursive: true });

const norm = (s) => s.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]/g, '');
const icons = JSON.parse(readFileSync(join(pkg, 'data', 'simple-icons.json'), 'utf8'));
const bySlug = new Map(icons.map((i) => [i.slug || norm(i.title), i]));
const byTitle = new Map(icons.map((i) => [norm(i.title), i]));

// White glyphs on dark brand colours, near-black on light ones.
const luminance = (hex) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const used = new Set();
let hits = 0;

for (const s of data.services) {
  delete s.icon;
  delete s.iconBg;
  if (EXCLUDE.has(s.name)) continue;
  const icon = MANUAL[s.name] ? bySlug.get(MANUAL[s.name]) : byTitle.get(norm(s.name));
  if (!icon) continue;
  const slug = icon.slug || norm(icon.title);
  const svgPath = join(pkg, 'icons', `${slug}.svg`);
  if (!existsSync(svgPath)) continue;

  const glyph = luminance(icon.hex) > 0.45 ? '#1d1d1f' : '#ffffff';
  const svg = readFileSync(svgPath, 'utf8').replace('<svg ', `<svg fill="${glyph}" `);
  writeFileSync(join(outDir, `${slug}.svg`), svg);
  s.icon = slug;
  s.iconBg = `#${icon.hex}`;
  used.add(`${slug}.svg`);
  hits++;
}

for (const f of readdirSync(outDir)) {
  if (f.endsWith('.svg') && !used.has(f)) unlinkSync(join(outDir, f));
}

writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log(`${hits} of ${data.services.length} services have icons (${used.size} files)`);
