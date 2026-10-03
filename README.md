# zakmaf-site

Code du site [zakmaf.net](https://zakmaf.net) (« La prise de note ») : un projet Astro
qui génère un site statique à partir d'une instance Ghost privée utilisée en headless.

Le conteneur interroge Ghost à intervalle régulier et reconstruit le site à chaque
changement. Le contenu (articles, images) n'est pas dans ce dépôt.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `GHOST_API_URL` | URL interne de Ghost |
| `GHOST_CONTENT_KEY` | Clé de la Content API |
| `GHOST_PUBLIC_URL` | URL publique déclarée dans Ghost (réécriture des liens d'images) |
| `YOUTUBE_CHANNEL_ID` | Chaîne dont la dernière vidéo est affichée en accueil |
| `MOCK_POSTS` | Nombre d'articles de test à ajouter (0 en production) |

Sans `GHOST_API_URL`, `npm run build` fonctionne hors ligne : le site est construit
uniquement avec des articles fictifs (12 par défaut, ou `MOCK_POSTS`). La CI s'en sert
pour vérifier la construction avant de publier l'image.

## Volumes

- `/out` : site généré, à servir par un serveur web
- `/ghost-images` : images de Ghost, en lecture seule

## Licence

La licence (fichier `LICENSE`) s'applique au code. Le portrait (`public/zak.jpg`),
le nom du site et son identité visuelle ne sont pas couverts.
