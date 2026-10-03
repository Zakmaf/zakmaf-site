import rss from '@astrojs/rss';
import { getPosts } from '../lib/ghost.js';
import { SITE } from '../lib/site.js';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: SITE.homeTitle,
    description: SITE.description,
    site: context.site,
    items: posts.map((p) => ({
      title: p.title,
      pubDate: new Date(p.published_at),
      description: p.custom_excerpt ?? p.excerpt,
      link: `/${p.section}/${p.slug}/`,
    })),
  });
}
