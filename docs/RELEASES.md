# Releases

Historique des versions publiées. Format et règles de rédaction : voir
[CONTRIBUTING.md](../CONTRIBUTING.md#rédaction-des-notes-de-version).

## v1.1.0 - 2026-10-04

### Nouveautés

- Page Contact : l'adresse e-mail s'affiche d'un clic, sans être lisible en clair par les robots dans le code de la page, avec un mot pour les créateurs qui proposent une collab. La page n'existe que si l'adresse est configurée. #55
- Pagination des sections au-delà de 24 articles (`/videos/2/`...), avec liens vers les articles plus récents et plus anciens. #26
- Métadonnées SEO et de partage saisies dans Ghost prises en compte : titre et description pour les moteurs de recherche, URL canonique, cartes Facebook et X. #57
- Dates de publication et de mise à jour, section et thèmes de chaque article annoncés aux réseaux et aux moteurs de recherche. #57

### Améliorations

- Navigation réorganisée : sections et Thèmes à gauche, recherche et thème clair ou sombre à droite ; À propos et Recherche rejoignent une colonne « Le site » au pied de page. #53
- Image de partage des articles en JPEG de 1200 px avec ses dimensions, acceptée par tous les réseaux. #57
- Texte alternatif des couvertures repris de Ghost. #57
- Description de l'accueil dédiée aux moteurs de recherche. #57
- Textes d'interface plus naturels, dans le ton des articles : accueil, intros des sections, page introuvable, recherche sans résultat, navigation entre articles. #56

### Correctifs

- Navigation mobile : À propos, Recherche et le bouton de thème ne sortent plus de l'écran ; les sections passent à la ligne au lieu de défiler. #54

### Migration

Aucune action requise. Pour afficher la page Contact, ajouter la variable `CONTACT_EMAIL` au conteneur
du builder (voir `deploy/example.env`) ; sans elle, le site ne propose pas de page Contact.

```bash
docker pull ghcr.io/zakmaf/zakmaf-site:v1.1.0
```

## v1.0.0 - 2026-10-04

Première version numérotée : elle fixe l'état du site en production et inaugure la publication
de l'image par release.

### Nouveautés

- Identité visuelle « Carnet » : signature zakmaf.net, filets paprika, fond à grain, thèmes clair et sombre, pied de page sombre avec sections et liens. #16 #17 #18
- Accueil éditorial : présentation de l'auteur, article à la une, sections numérotées, thèmes les plus utilisés. #19
- Cartes Boilerplate : nom du fichier (légende du premier bloc de code dans Ghost), langage et aperçu coloré des premières lignes. #20
- Miniatures au-dessus du titre dans les listes, avec pastille de lecture pour les vidéos. #21
- Fin d'article : pastille « Regarder la vidéo » sur la couverture, fichiers associés à une vidéo, bloc auteur. #24
- Liens croisés entre un article Vidéos et ses fichiers Boilerplate, à partir de la même vidéo YouTube. #24
- Thèmes : les tags Ghost deviennent des puces et des pages par thème. #23
- Sommaire numéroté dans les articles qui comptent au moins trois intertitres, repliable sans JavaScript. #25
- Recherche plein texte (articles, code et légendes compris), servie par le site lui-même, sans service externe. #27
- Image de partage par défaut pour les pages sans couverture.
- Numéro de version affiché dans le pied de page, avec lien vers la release.

### Améliorations

- Images de Ghost avec dimensions déclarées et variantes WebP 480, 960 et 1600 px : environ 136 Ko d'images pour un article sur mobile au lieu de 3 Mo. #28
- Coloration du code aux couleurs du site, contraste AA dans les deux thèmes.
- Styles regroupés dans une seule feuille, sans surcharges croisées. #22
- Publication du site sans période de site vide : 148 lectures en échec contre 47 645 lors d'un essai de 30 publications en 4 secondes. #31
- Construction hors ligne avec des articles fictifs quand Ghost n'est pas configuré : la CI vérifie le site sans accès à Ghost.
- Exemple de déploiement complet et générique dans `deploy/` (Ghost privé, MySQL, builder, nginx).
- Documentation pour les contributeurs : guide de contribution, modèle de PR, consignes pour les agents de code. #30

### Correctifs

- Navigation et pied de page lisibles sur mobile.
- Abandon de la tuile « dernière vidéo YouTube » de l'accueil : le flux RSS de YouTube refuse les requêtes du serveur.

### Sécurité

- Workflows CI durcis : actions figées par empreinte, permissions minimales, recherche de secrets sur tout l'historique.
- Image de base `node:22-alpine` figée par empreinte.

### Mise à jour de la stack

- Ajoute `sharp` 0.35.5 (variantes d'images) et `pagefind` 1.5.2 (recherche) aux dépendances directes.
- Passe `actions/checkout` en 7.0.1, `actions/setup-node` en 7.0.0, `docker/build-push-action` en 7.4.0, `docker/login-action` en 4.6.0, `docker/metadata-action` en 6.2.0, `gitleaks/gitleaks-action` en 3.0.0.

### Migration

L'image n'est plus publiée à chaque fusion dans `main`, mais à chaque release, sous les tags `latest`,
`v1`, `v1.0` et `v1.0.0`. Le tag `sha-<court>` n'est plus produit. Remplacer `latest` par `v1` dans la
pile pour suivre les versions 1.x sans changement de rupture.

La variable `YOUTUBE_CHANNEL_ID` n'est plus lue et peut être retirée.

```bash
docker pull ghcr.io/zakmaf/zakmaf-site:v1.0.0
```
