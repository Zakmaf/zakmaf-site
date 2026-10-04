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
| `MOCK_POSTS` | Nombre d'articles de test à ajouter (0 en production) |
| `GHOST_IMAGES_DIR` | Dossier des images de Ghost (`/ghost-images` par défaut) |

Sans `GHOST_API_URL`, `npm run build` fonctionne hors ligne : le site est construit
uniquement avec des articles fictifs (12 par défaut, ou `MOCK_POSTS`). La CI s'en sert
pour vérifier la construction avant de publier l'image.

## Volumes

- `/out` : site généré, à servir par un serveur web
- `/ghost-images` : images de Ghost, en lecture seule

À chaque construction, les images de Ghost reçoivent leurs dimensions et des variantes WebP
(480, 960 et 1600 px de large, sans agrandissement) servies sous `/content/variants/`. Les
variantes sont gardées en cache dans le conteneur (`.cache/variants`) : seule une image
nouvelle ou modifiée est recalculée. Sans dossier d'images, le site est construit sans
variantes.

## Déploiement

Le dossier [`deploy/`](deploy/) contient un exemple complet et générique : `compose.example.yml`
(Ghost privé, MySQL, builder, nginx), `example.env` (variables à renseigner) et
`nginx.conf`. Domaines, chemins et exposition y sont des exemples à adapter ; la
configuration réelle du serveur n'est pas dans ce dépôt.

## Versions

L'image est publiée à chaque version taguée `vX.Y.Z`, avec sa release GitHub ([historique](docs/RELEASES.md)) :

| Tag | Usage |
|---|---|
| `latest` | Dernière version stable |
| `v1` | Dernière 1.x : correctifs et nouveautés, sans changement de rupture (recommandé) |
| `v1.0` | Dernière 1.0.x : correctifs seulement |
| `v1.0.0` | Version exacte, pour épingler ou revenir en arrière |

La version en production s'affiche dans le pied de page du site.

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

La licence (fichier `LICENSE`) s'applique au code. Le portrait (`public/zak.jpg`),
le nom du site et son identité visuelle ne sont pas couverts.
