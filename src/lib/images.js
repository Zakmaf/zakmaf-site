import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';

// Variantes WebP des images de Ghost, générées pendant la construction.
// Les originaux sont lus dans GHOST_IMAGES_DIR (le volume /ghost-images du conteneur) ;
// les variantes sont écrites dans un cache qui survit d'une construction à l'autre, puis
// copiées par le builder dans dist/content/variants. Sans dossier d'images (CI, poste
// local), les images restent telles quelles.
const SOURCE = process.env.GHOST_IMAGES_DIR || '/ghost-images';
export const VARIANTS_DIR = '.cache/variants';
const URL_PREFIX = '/content/variants';
const WIDTHS = [480, 960, 1600];
const FORMATS = /\.(jpe?g|png|webp)$/i;
// sharp n'est chargé qu'en présence d'images ; s'il ne se charge pas, le site est construit sans variantes.
const sharp = existsSync(SOURCE) ? (await import('sharp').catch(() => null))?.default : null;
const ENABLED = Boolean(sharp);

// Largeur d'affichage selon l'emplacement de l'image.
export const SIZES = {
  body: '(min-width: 48rem) 46rem, 100vw',
  wide: '(min-width: 60rem) 56rem, 100vw',
  full: '100vw',
  cover: '(min-width: 48rem) 46rem, 100vw',
  thumb: '(min-width: 72rem) 21rem, (min-width: 44rem) 45vw, 100vw',
  featured: '(min-width: 60rem) 28rem, 100vw',
};

const memo = new Map();

// Dimensions et srcset d'une image servie sous /content/images/, ou null.
export function imageInfo(src) {
  if (!ENABLED || !src?.startsWith('/content/images/') || !FORMATS.test(src)) return Promise.resolve(null);
  if (!memo.has(src)) memo.set(src, build(src).catch(() => null));
  return memo.get(src);
}

async function build(src) {
  const file = `${SOURCE}/${decodeURIComponent(src.slice('/content/images/'.length))}`;
  const { size, mtimeMs } = await stat(file);
  const meta = await sharp(file).metadata();
  // Orientation EXIF 5 à 8 : l'image affichée est tournée d'un quart de tour.
  const [width, height] = meta.orientation >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  if (!width || !height) return null;
  const key = createHash('sha1').update(`${src}:${size}:${mtimeMs}`).digest('hex').slice(0, 12);
  // Pas d'agrandissement : les largeurs au-delà de l'original sont remplacées par l'original.
  const widths = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, WIDTHS.at(-1))])];
  await mkdir(VARIANTS_DIR, { recursive: true });
  const srcset = [];
  for (const w of widths) {
    const name = `${key}-${w}.webp`;
    const out = `${VARIANTS_DIR}/${name}`;
    if (!existsSync(out)) await sharp(file).rotate().resize({ width: w }).webp({ quality: 78 }).toFile(out);
    srcset.push(`${URL_PREFIX}/${name} ${w}w`);
  }
  return { width, height, srcset: srcset.join(', ') };
}

// Attributs à poser sur une balise <img> à partir de imageInfo() (à étaler en Astro).
export const imgProps = (info, sizes) =>
  info ? { width: info.width, height: info.height, srcset: info.srcset, sizes } : {};

// Images du contenu Ghost : dimensions, srcset WebP, chargement différé.
export async function optimizeHtml(html) {
  if (!ENABLED || !html) return html;
  const tags = [...new Set(html.match(/<img\b[^>]*>/g) ?? [])];
  for (const tag of tags) {
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    const info = await imageInfo(src);
    if (!info) continue;
    // Classe de la carte Ghost qui contient l'image (largeur normale, large ou pleine).
    const before = html.slice(0, html.indexOf(tag));
    const open = before.lastIndexOf('<figure');
    const figure = open > before.lastIndexOf('</figure>') ? before.slice(open, before.indexOf('>', open)) : '';
    const sizes = /kg-width-full/.test(figure) ? SIZES.full : /kg-width-wide/.test(figure) ? SIZES.wide : SIZES.body;
    const attrs = tag
      .replace(/\s(srcset|sizes|width|height|loading|decoding)="[^"]*"/g, '')
      .replace(/\s*\/?>$/, '');
    const next = `${attrs} width="${info.width}" height="${info.height}" srcset="${info.srcset}" sizes="${sizes}" loading="lazy" decoding="async">`;
    html = html.replaceAll(tag, next);
  }
  return html;
}
