import { codeToHtml } from 'shiki';

const API = process.env.GHOST_API_URL;
const KEY = process.env.GHOST_CONTENT_KEY;
const PUBLIC_URL = process.env.GHOST_PUBLIC_URL;
const HEADERS = { 'X-Forwarded-Proto': 'https' };

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
    return `<p class="yt-link"><a href="${watchUrl(id)}">Regarder la vidéo sur YouTube →</a></p>`;
  });
}

const shikiOptions = (lang) => ({
  lang,
  themes: { light: 'github-light', dark: 'github-dark' },
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

function mockPosts(n) {
  const topics = ['Docker Compose', 'Proxmox', 'Traefik', 'sauvegardes Borg', 'réseau Tailscale', 'CrowdSec', 'Jellyfin', 'supervision'];
  return Array.from({ length: n }, (_, i) => ({
    title: `Article de test ${i + 1} : ${topics[i % topics.length]} en pratique${i % 4 === 0 ? ', avec un titre volontairement long pour tester le retour à la ligne' : ''}`,
    slug: `test-${i + 1}`,
    html: '<p>Contenu de démonstration pour évaluer la mise en page.</p><pre><code class="language-yaml">services:\n  demo:\n    image: nginx:alpine\n    restart: unless-stopped</code></pre><p>Fin du contenu de démonstration.</p>',
    excerpt: 'Texte de démonstration pour évaluer la mise en page avec un grand nombre d’articles, des titres longs et des extraits qui tiennent sur plusieurs lignes.',
    custom_excerpt: null,
    feature_image: i % 2 ? '/mock.svg' : null,
    published_at: new Date(Date.now() - (i + 1) * 3 * 864e5).toISOString(),
    reading_time: 2 + (i % 9),
    tags: [{ slug: SECTIONS[i % SECTIONS.length] }],
  }));
}

async function load() {
  const posts = [];
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
  return Promise.all(
    posts.map(async (p) => {
      const section = SECTIONS.find((s) => p.tags.some((t) => t.slug === s)) ?? 'blog';
      // Vidéo du post : première vidéo YouTube citée, uniquement dans la section Vidéos.
      const videoId = section === 'videos' ? ((p.html || '').match(YT)?.[1] ?? null) : null;
      return {
        ...p,
        excerpt: p.custom_excerpt || summarize(textOf(p.html)),
        html: await highlight(unembed(localize(p.html), videoId)),
        feature_image: localize(p.feature_image),
        section,
        videoId,
        videoUrl: videoId ? watchUrl(videoId) : null,
      };
    })
  );
}

let cache;
export function getPosts() {
  return (cache ??= load());
}

export async function getPage(slug) {
  const res = await fetch(`${API}/ghost/api/content/pages/slug/${slug}/?key=${KEY}`, { headers: HEADERS });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Ghost API ${res.status} on page ${slug}`);
  const page = (await res.json()).pages[0];
  return { ...page, html: await highlight(unembed(localize(page.html), null)), feature_image: localize(page.feature_image) };
}
