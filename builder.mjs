import { execSync } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';

const { GHOST_API_URL: API, GHOST_CONTENT_KEY: KEY, YOUTUBE_CHANNEL_ID: YT } = process.env;
const HEADERS = { 'X-Forwarded-Proto': 'https' };
const INTERVAL = 60_000;
const YT_EVERY = 15; // vérification YouTube tous les 15 cycles

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

const decode = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');

async function latestVideo() {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YT}`);
  if (!res.ok) throw new Error(`feed ${res.status}`);
  const entries = (await res.text()).split('<entry>').slice(1);
  const e = entries.find((x) => !x.includes('/shorts/')) ?? entries[0];
  if (!e) return null;
  const pick = (re) => e.match(re)?.[1] ?? '';
  return {
    id: pick(/<yt:videoId>([^<]+)</),
    title: decode(pick(/<title>([^<]+)</)),
    published: pick(/<published>([^<]+)</),
  };
}

async function saveVideo(v) {
  let img;
  for (const name of ['maxresdefault', 'mqdefault']) {
    const r = await fetch(`https://i.ytimg.com/vi/${v.id}/${name}.jpg`);
    if (r.ok) { img = Buffer.from(await r.arrayBuffer()); break; }
  }
  await mkdir('src/data', { recursive: true });
  if (img) await writeFile('public/youtube-latest.jpg', img);
  await writeFile('src/data/youtube.json', JSON.stringify({ ...v, hasImage: Boolean(img) }));
}

function build() {
  execSync(
    'npm run build && mkdir -p dist/content && cp -r /ghost-images dist/content/images && rm -rf /out/* && cp -r dist/. /out/',
    { stdio: 'inherit' }
  );
}

let last = null;
let video = null;
let cycle = 0;
while (true) {
  try {
    if (YT && cycle % YT_EVERY === 0) {
      try {
        video = (await latestVideo()) ?? video;
      } catch (e) {
        console.error(`youtube: ${e.message}`);
      }
    }
    cycle++;
    const fp = `${await latest('posts')}#${await latest('pages')}#${video?.id ?? ''}`;
    if (fp !== last) {
      console.log(`change detected (${fp}), building`);
      await fetchCardAssets();
      if (video) await saveVideo(video);
      build();
      last = fp;
      console.log('build ok');
    }
  } catch (e) {
    console.error(`cycle failed: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, INTERVAL));
}
