import { codeToHtml } from 'shiki';
import { codeLight, codeDark } from './code-theme.js';
import { imageInfo, optimizeHtml } from './images.js';

const API = process.env.GHOST_API_URL;
const KEY = process.env.GHOST_CONTENT_KEY;
const PUBLIC_URL = process.env.GHOST_PUBLIC_URL;
const HEADERS = { 'X-Forwarded-Proto': 'https' };
// Sans GHOST_API_URL : construction hors ligne, uniquement avec des articles fictifs (CI, poste local).
const OFFLINE = !API;
const OFFLINE_POSTS = 12;

export const SECTIONS = ['videos', 'boilerplate', 'blog'];

const localize = (s) =>
  s
    ? s
        .replaceAll(`${PUBLIC_URL}/content/`, '/content/')
        .replace(/\/content\/images\/size\/w\d+\//g, '/content/images/')
    : s;

const decode = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, '&');

// Texte brut d'un article, sans code, figures ni intertitres (sert à l'extrait).
const textOf = (html) =>
  decode(
    (html || '')
      .replace(/<(pre|figure|script|style|h[1-6])\b[\s\S]*?<\/\1>/g, ' ')
      .replace(/<\/(p|li|blockquote|div)>|<br\s*\/?>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

// Coupe au dernier mot entier avant max caractères.
const summarize = (s, max = 160) => {
  if (s.length <= max) return s;
  const head = s.slice(0, max + 1);
  const i = head.lastIndexOf(' ');
  return `${head.slice(0, i > 0 ? i : max).replace(/[\s,;:.!?–-]+$/, '')}…`;
};

// YouTube : identifiant de vidéo, et remplacement des lecteurs intégrés par des liens.
const YT = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/;
const EMBED = /<figure class="kg-card kg-embed-card[^"]*">[\s\S]*?<\/figure>/g;
const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

function unembed(html, mainId) {
  if (!html) return html;
  let skipped = false;
  return html.replace(EMBED, (fig) => {
    const id = fig.match(YT)?.[1];
    if (!id) return fig;
    if (id === mainId && !skipped) {
      skipped = true;
      return '';
    }
    return `<p class="yt-link" data-yt="${id}"><a href="${watchUrl(id)}">Regarder la vidéo sur YouTube →</a></p>`;
  });
}

const shikiOptions = (lang) => ({
  lang,
  themes: { light: codeLight, dark: codeDark },
  defaultColor: false,
});

async function highlight(html) {
  if (!html) return html;
  const re = /<pre><code(?: class="language-([\w+#-]+)")?>([\s\S]*?)<\/code><\/pre>/g;
  for (const m of [...html.matchAll(re)]) {
    const code = decode(m[2]);
    let out;
    try {
      out = await codeToHtml(code, shikiOptions(m[1] || 'text'));
    } catch {
      out = await codeToHtml(code, shikiOptions('text'));
    }
    html = html.replace(m[0], () => out);
  }
  return html;
}

// Aperçu du premier bloc de code (cartes Boilerplate) : langage, nom de fichier
// (légende du bloc de code dans Ghost, si elle existe) et premières lignes colorées.
const FIRST_CODE = /<pre><code(?: class="language-([\w+#-]+)")?>([\s\S]*?)<\/code><\/pre>(?:\s*<figcaption>([\s\S]*?)<\/figcaption>)?/;
const LANG_LABELS = { yaml: 'YAML', yml: 'YAML', json: 'JSON', bash: 'Shell', sh: 'Shell', shell: 'Shell', toml: 'TOML', ini: 'INI', dockerfile: 'Dockerfile', nginx: 'Nginx', text: 'Texte' };
const PREVIEW_LINES = 4;

// Texte brut d'une légende : on garde ce qui est entre « > » et « < », puis aucun
// chevron ne survit au décodage des entités.
const captionText = (html) =>
  decode(html.split('>').map((part) => part.split('<')[0]).join(''))
    .replace(/[<>]/g, '')
    .trim();

async function codePreview(html) {
  const m = (html || '').match(FIRST_CODE);
  if (!m) return null;
  const lang = m[1] || 'text';
  const lines = decode(m[2]).replace(/\n+$/, '').split('\n');
  const head = lines.slice(0, PREVIEW_LINES).join('\n');
  let preview;
  try {
    preview = await codeToHtml(head, shikiOptions(lang));
  } catch {
    preview = await codeToHtml(head, shikiOptions('text'));
  }
  const file = m[3] ? captionText(m[3]) : '';
  return { lang: LANG_LABELS[lang] ?? lang.toUpperCase(), file: file || null, preview };
}

// Sommaire : intertitres h2/h3 du contenu, avec une ancre sur chacun (celle de Ghost si
// elle existe). Affiché à partir de TOC_MIN intertitres.
const TOC_MIN = 3;
const HEADING = /<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g;
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'section';

function outline(html) {
  const toc = [];
  const used = new Set();
  let count = 0;
  const out = (html || '').replace(HEADING, (tag, level, attrs, inner) => {
    const text = captionText(inner);
    let id = attrs.match(/\sid="([^"]+)"/)?.[1];
    if (!id) {
      const base = slugify(text);
      id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      attrs = `${attrs} id="${id}"`;
    }
    used.add(id);
    // Un h3 se range sous le h2 qui le précède.
    const entry = { id, text, children: [] };
    if (level === '3' && toc.length) toc.at(-1).children.push(entry);
    else toc.push(entry);
    count++;
    return `<h${level}${attrs}>${inner}</h${level}>`;
  });
  return { html: out, toc: count >= TOC_MIN ? toc : [] };
}

function mockPosts(n) {
  const topics = ['Docker Compose', 'Proxmox', 'Traefik', 'sauvegardes Borg', 'réseau Tailscale', 'CrowdSec', 'Jellyfin', 'supervision'];
  return Array.from({ length: n }, (_, i) => ({
    title: `Article de test ${i + 1} : ${topics[i % topics.length]} en pratique${i % 4 === 0 ? ', avec un titre volontairement long pour tester le retour à la ligne' : ''}`,
    slug: `test-${i + 1}`,
    html: `<p>Contenu de démonstration pour évaluer la mise en page.</p><figure class="kg-card kg-code-card"><pre><code class="language-yaml">services:\n  demo:\n    image: nginx:alpine\n    ports:\n      - 8080:80\n    restart: unless-stopped</code></pre>${i % 2 ? '' : '<figcaption><p><span>demo/compose.yml</span></p></figcaption>'}</figure><p>Fin du contenu de démonstration.</p>`,
    excerpt: 'Texte de démonstration pour évaluer la mise en page avec un grand nombre d’articles, des titres longs et des extraits qui tiennent sur plusieurs lignes.',
    custom_excerpt: null,
    feature_image: i % 2 ? '/mock.svg' : null,
    published_at: new Date(Date.now() - (i + 1) * 3 * 864e5).toISOString(),
    reading_time: 2 + (i % 9),
    tags: [
      { slug: SECTIONS[i % SECTIONS.length], name: SECTIONS[i % SECTIONS.length] },
      { slug: ['docker', 'homelab', 'reseau'][i % 3], name: ['Docker', 'Homelab', 'Réseau'][i % 3] },
    ],
  }));
}

async function load() {
  const posts = [];
  if (OFFLINE) {
    const n = Number(process.env.MOCK_POSTS) || OFFLINE_POSTS;
    console.warn(`GHOST_API_URL absent : construction hors ligne avec ${n} articles fictifs`);
    return relate(await Promise.all(mockPosts(n).map(prepare)));
  }
  let page = 1;
  while (page) {
    const url = `${API}/ghost/api/content/posts/?key=${KEY}&limit=100&page=${page}&include=tags`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Ghost API ${res.status} on page ${page}`);
    const data = await res.json();
    posts.push(...data.posts);
    page = data.meta.pagination.next;
  }
  const mock = Number(process.env.MOCK_POSTS || 0);
  if (mock) posts.push(...mockPosts(mock));
  return relate(await Promise.all(posts.map(prepare)));
}

// Liens croisés automatiques : un article hors Vidéos qui intègre la vidéo d'un article Vidéos
// pointe vers cet article (au lieu de YouTube), et l'article Vidéos liste ces fichiers.
const YT_LINK = /<p class="yt-link" data-yt="([\w-]{11})"><a href="[^"]*">[^<]*<\/a><\/p>/g;

function relate(posts) {
  const byVideo = new Map(posts.filter((p) => p.videoId).map((p) => [p.videoId, p]));
  for (const p of posts) p.files = [];
  for (const p of posts) {
    if (p.section === 'videos' || !p.html) continue;
    p.html = p.html.replace(YT_LINK, (tag, id) => {
      const video = byVideo.get(id);
      if (!video) return tag;
      if (!p.videoPost) {
        p.videoPost = { title: video.title, href: `/videos/${video.slug}/` };
        video.files.push({ title: p.title, href: `/${p.section}/${p.slug}/`, file: p.code?.file ?? null, lang: p.code?.lang ?? null });
      }
      return `<p class="yt-link" data-yt="${id}"><a href="/videos/${video.slug}/">Voir l'article de la vidéo →</a></p>`;
    });
  }
  return posts;
}

async function prepare(p) {
  const section = SECTIONS.find((s) => p.tags.some((t) => t.slug === s)) ?? 'blog';
  // Thèmes : tags publics de Ghost, hors sections et hors tags internes (« #… »).
  const topics = p.tags
    .filter((t) => !SECTIONS.includes(t.slug) && t.visibility !== 'internal' && !t.name?.startsWith('#'))
    .map((t) => ({ slug: t.slug, name: t.name ?? t.slug }));
  // Vidéo du post : première vidéo YouTube citée, uniquement dans la section Vidéos.
  const videoId = section === 'videos' ? ((p.html || '').match(YT)?.[1] ?? null) : null;
  const { html, toc } = outline(await optimizeHtml(await highlight(unembed(localize(p.html), videoId))));
  return {
    ...p,
    excerpt: p.custom_excerpt || summarize(textOf(p.html)),
    html,
    toc,
    feature_image: localize(p.feature_image),
    feature: await imageInfo(localize(p.feature_image)),
    section,
    topics,
    videoId,
    videoUrl: videoId ? watchUrl(videoId) : null,
    code: section === 'boilerplate' ? await codePreview(p.html) : null,
  };
}

// Thèmes utilisés, du plus fréquent au moins fréquent.
export async function getTopics() {
  const counts = new Map();
  for (const p of await getPosts()) {
    for (const t of p.topics) {
      const c = counts.get(t.slug) ?? { ...t, count: 0 };
      c.count++;
      counts.set(t.slug, c);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'));
}

let cache;
export function getPosts() {
  return (cache ??= load());
}

export async function getPage(slug) {
  if (OFFLINE) return null;
  const res = await fetch(`${API}/ghost/api/content/pages/slug/${slug}/?key=${KEY}`, { headers: HEADERS });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Ghost API ${res.status} on page ${slug}`);
  const page = (await res.json()).pages[0];
  const image = localize(page.feature_image);
  return { ...page, html: await optimizeHtml(await highlight(unembed(localize(page.html), null))), feature_image: image, feature: await imageInfo(image) };
}
