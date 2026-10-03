# Consignes pour les agents de code

Ce fichier s'adresse aux assistants de code (`CLAUDE.md` est un lien vers lui). Les règles
de contribution complètes sont dans [CONTRIBUTING.md](CONTRIBUTING.md) ; elles s'appliquent
aussi aux agents. Ce qui suit les résume et ajoute le contexte utile pour modifier le code.

## Le projet

Site statique [zakmaf.net](https://zakmaf.net) (« La prise de note »), en français, généré
par Astro à partir d'une instance Ghost privée utilisée en headless. Ghost n'est jamais
exposé au public : seul le site statique l'est.

Chaîne de publication :

1. `builder.mjs` tourne dans le conteneur, sur le serveur. Toutes les 60 s il lit la date
   de dernière modification des articles et pages (Content API, `limit=1`), et toutes les
   15 itérations le flux RSS de la chaîne YouTube.
2. Au moindre changement : `npm run build`, copie des images de Ghost dans
   `dist/content/images` et de leurs variantes WebP dans `dist/content/variants`, puis
   `publish.mjs` remplace le contenu de `/out` sans période de site vide.
3. Un serveur web sert `/out` en lecture seule.

L'image Docker ne contient que le code : le site est généré au démarrage du conteneur.
Elle est publiée par la CI sur `ghcr.io/zakmaf/zakmaf-site` après fusion dans `main` ;
la mise en production est un nouveau tirage manuel de l'image par le mainteneur.

## Carte du code

| Fichier | Rôle |
|---|---|
| `src/lib/ghost.js` | Accès à Ghost, mode hors ligne, coloration Shiki, liens Vidéos ↔ Boilerplate, thèmes (tags) |
| `src/lib/site.js` | Titre, sections, textes d'introduction, auteur, réseaux |
| `src/lib/images.js` | Dimensions et variantes WebP des images de Ghost (cache `.cache/variants`) |
| `src/lib/code-theme.js` | Thèmes de coloration du code, alignés sur les jetons CSS |
| `src/layouts/Base.astro` | `<head>`, Open Graph, en-tête, pied de page, scripts navigateur |
| `src/styles/global.css` | Tous les styles : jetons (clair et sombre), puis une partie par zone |
| `src/pages/` | Accueil, sections (`[section]`), articles (`[section]/[slug]`), thèmes, À propos, RSS |
| `src/components/` | Liste d'articles (cartes fichier Boilerplate comprises), puces de thèmes |
| `builder.mjs`, `publish.mjs` | Boucle de reconstruction et publication dans `/out` |

Les trois sections correspondent aux tags Ghost de slug `videos`, `boilerplate` et `blog`
(`blog` par défaut). Les autres tags publics deviennent des thèmes. Sur une carte Boilerplate, le nom de fichier est la légende du premier bloc de code de
l'article.

## Travailler

```sh
npm ci
npm run build   # sans GHOST_API_URL : construction hors ligne, 12 articles fictifs (ou MOCK_POSTS)
npm run dev
```

Aucune instance Ghost n'est nécessaire ni disponible : travailler et tester en mode hors
ligne. Pour un changement d'interface, vérifier le rendu en clair et en sombre, à 390 px
de large et sur grand écran.

## Règles

- Lire un fichier avant de le modifier ; modifier la règle CSS existante plutôt que la
  surcharger. Pas de nouvelle feuille de style.
- Scripts navigateur en `<script is:inline>` ; variables de construction via `process.env`.
- Aucune ressource externe : CDN, Google Fonts, lecteur YouTube intégré, traceur. Les
  polices sont auto-hébergées (`@fontsource`).
- La colonne de texte des articles reste à 46rem.
- Textes d'interface, commentaires, messages de commit et PR en français.
- Contraste WCAG AA (4,5:1) pour tout texte, couleurs de code comprises.
- API Ghost : pagination par pages de 100, jamais `limit=all` ; en-tête
  `X-Forwarded-Proto: https` sur chaque requête ; pas de webhooks Ghost.
- La CI n'a pas accès à Ghost et ne doit pas l'avoir.

## Ce qui ne doit jamais être commité

Le dépôt et l'image sont publics, l'historique est permanent.

- Secrets (clés, jetons, mots de passe, `.env`), y compris comme argument de construction
  de l'image.
- Noms d'hôtes internes, adresses IP, chemins du serveur, adresses e-mail.
- Fichiers de déploiement réels (compose, reverse proxy, pare-feu, sauvegardes, serveur
  web) et contenu exporté de Ghost.
- Fichiers générés (`dist/`, `src/data/youtube.json`, `public/ghost/`,
  `public/youtube-latest.jpg`), ni dans le dépôt ni dans l'image.

Toute configuration passe par les variables d'environnement décrites dans le README.

## Commits et PR

- Une PR par sujet vers `main`, commits courts et ciblés.
- Auteur : l'adresse `noreply` de GitHub, jamais une adresse personnelle.
- `npm run build` doit passer en local ; en CI, `secrets`, `check` et `build` doivent être
  verts.
