import { execSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { publish } from './publish.mjs';

const { GHOST_API_URL: API, GHOST_CONTENT_KEY: KEY } = process.env;
const HEADERS = { 'X-Forwarded-Proto': 'https' };
const INTERVAL = 60_000;

async function latest(type) {
  const url = `${API}/ghost/api/content/${type}/?key=${KEY}&limit=1&order=updated_at%20desc&fields=updated_at`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Ghost API ${res.status} (${type})`);
  const d = await res.json();
  return `${d.meta.pagination.total}|${d[type][0]?.updated_at ?? ''}`;
}

async function fetchCardAssets() {
  execSync('mkdir -p public/ghost');
  for (const f of ['cards.min.css', 'cards.min.js']) {
    const res = await fetch(`${API}/public/${f}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Ghost asset ${f}: ${res.status}`);
    await writeFile(`public/ghost/${f}`, await res.text());
  }
}

async function build() {
  const steps = [
    'npm run build',
    'mkdir -p dist/content',
    'cp -r /ghost-images dist/content/images',
    // Variantes WebP produites par src/lib/images.js pendant la construction.
    'if [ -d .cache/variants ]; then cp -r .cache/variants dist/content/variants; fi',
  ];
  execSync(steps.join(' && '), { stdio: 'inherit' });
  await publish('dist', '/out');
}

let last = null;
while (true) {
  try {
    const fp = `${await latest('posts')}#${await latest('pages')}`;
    if (fp !== last) {
      console.log(`change detected (${fp}), building`);
      await fetchCardAssets();
      await build();
      last = fp;
      console.log('build ok');
    }
  } catch (e) {
    console.error(`cycle failed: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, INTERVAL));
}
