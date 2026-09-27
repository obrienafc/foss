// Regenerates README.md from data/services.json.
// Usage: node scripts/build-readme.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const { updated, services } = JSON.parse(readFileSync(new URL('data/services.json', root), 'utf8'));

const TAGS = {
  request: 'request needed',
  limits: 'has limits',
  strict: '**strict rules**',
};

const active = services.filter((s) => s.status !== 'retired');
const retired = services.filter((s) => s.status === 'retired');
const categories = [...new Set(active.map((s) => s.category))];
const anchor = (c) => c.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');

const line = (s) => {
  const extras = s.tags.map((t) => TAGS[t]).filter(Boolean);
  let out = `- [${s.name}](${s.url}) - ${s.description}`;
  if (extras.length) out += ` - ${extras.join(' - ')}`;
  if (s.status === 'changed' && s.note) out += `\n  - _Changed:_ ${s.note}`;
  return out;
};

let md = `<p align="center">
  <img src="assets/logo/main-green.svg" alt="Free for Open Source" width="450" />
</p>

<p align="center">A directory of services available free to open-source projects.</p>

<p align="center">
  <a href="https://github.com/obrienafc/foss/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/obrienafc/foss"></a>
  <a href="https://github.com/obrienafc/foss/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/obrienafc/foss"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/obrienafc/foss"></a>
</p>

**Search and filter the list at [foss.patrickob.me](https://foss.patrickob.me).**

Last reviewed: ${updated}. Offers change often, so always check the provider's own terms.

> This file is generated from [\`data/services.json\`](data/services.json). Edit that file, then run \`node scripts/build-readme.mjs\`.

## Contents

${categories.map((c) => `- [${c}](#${anchor(c)})`).join('\n')}
- [No longer free or discontinued](#no-longer-free-or-discontinued)

`;

for (const c of categories) {
  md += `## ${c}\n\n${active.filter((s) => s.category === c).map(line).join('\n')}\n\n`;
}

md += `## No longer free or discontinued\n\nKept here so you know why they were removed.\n\n`;
md += retired.map((s) => `- ~~[${s.name}](${s.url})~~ - ${s.note}`).join('\n') + '\n';

writeFileSync(new URL('README.md', root), md);
console.log(`README.md: ${active.length} active, ${retired.length} retired, ${categories.length} categories`);
