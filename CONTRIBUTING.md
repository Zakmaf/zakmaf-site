# Contribuer

Ce dépôt contient le code du site [zakmaf.net](https://zakmaf.net). C'est un projet
personnel : les signalements de bugs et les corrections sont bienvenus, les nouvelles
fonctionnalités se discutent d'abord dans une issue.

Le contenu du site (articles, pages, images) est rédigé dans Ghost et ne passe pas par
ce dépôt. Une coquille dans un article se signale par une issue, pas par une PR.

## Ce qui ne doit jamais être commité

Le dépôt et l'image Docker sont publics, et l'historique Git est permanent.

- secrets : clés d'API, jetons, mots de passe, fichiers `.env` ;
- noms d'hôtes internes, adresses IP, chemins du serveur, adresses e-mail ;
- fichiers de déploiement réels : compose, configurations de reverse proxy, de pare-feu,
  de sauvegarde ou de serveur web ;
- contenu exporté de Ghost.

Toute configuration passe par des variables d'environnement (voir le README). Le job
`secrets` de la CI (gitleaks, historique complet) bloque une PR qui contient un secret ;
si cela arrive, le secret est compromis : il faut le révoquer, pas seulement le retirer
du commit.

## Travailler en local

Prérequis : Node.js 22.12 ou plus récent.

```sh
npm ci
npm run build   # sans GHOST_API_URL : construction hors ligne avec des articles fictifs
npm run dev     # serveur de développement, même mode hors ligne
```

Le mode hors ligne génère 12 articles fictifs (ou `MOCK_POSTS`) répartis dans les trois
sections ; la page À propos affiche alors la bio de `src/lib/site.js`. Aucune instance
Ghost n'est nécessaire pour contribuer.

## Règles du code

- Lire un fichier avant de le modifier. `src/layouts/Base.astro` porte le `<head>` et la
  navigation ; tous les styles globaux sont dans `src/styles/global.css` (jetons, puis
  une partie par zone de la page). Pas de surcharge par spécificité (`body …`) : modifier
  la règle existante.
- Scripts côté navigateur : `<script is:inline>`. Variables de construction :
  `process.env`, pas `import.meta.env`.
- Aucune ressource externe : pas de CDN, de Google Fonts, de lecteur YouTube intégré ni de
  traceur. Les polices sont auto-hébergées via `@fontsource`.
- La colonne de texte des articles reste à 46rem (classe `narrow`).
- Le site est en français : textes d'interface, messages de commit, commentaires.
- Pas de nouvelle dépendance sans justification dans la PR.

## Commits et pull requests

- Une PR par sujet, des commits courts et ciblés.
- Messages de commit en français, à l'infinitif ou au nominal, première ligne sous
  72 caractères (ex. « Image Open Graph par défaut pour les pages sans couverture »).
- Auteur : utiliser l'adresse `noreply` fournie par GitHub, pas une adresse personnelle.
- Avant d'ouvrir la PR : `npm run build` doit passer en local.
- La PR vise `main`. Les jobs `secrets`, `check` et `build` doivent être verts ; en PR,
  l'image est construite mais pas publiée.

## Intégration

Le workflow `.github/workflows/image.yml` enchaîne, sur chaque PR et chaque fusion dans `main` :

1. `secrets` : gitleaks sur tout l'historique ;
2. `check` : `npm ci` puis construction hors ligne ;
3. `build` : construction de l'image Docker, **sans publication**.

Dependabot propose les mises à jour une fois par mois. Les versions mineures et les
correctifs sont fusionnés automatiquement une fois la CI verte ; les versions majeures
sont relues à la main. Ces mises à jour partent avec la release suivante.

## Releases

- Versionnement sémantique `vMAJEUR.MINEUR.PATCH`, appliqué au site :
  - **MAJEUR** : le déploiement doit être adapté (variable, volume, réseau, compose) ou des
    URL publiques changent ;
  - **MINEUR** : nouvelle fonctionnalité visible ;
  - **PATCH** : correctifs, ajustements visuels, mises à jour de dépendances.
- La version vit dans `package.json` (`npm version X.Y.Z --no-git-tag-version`) et s'affiche
  dans le pied de page. Elle est mise à jour **avant** la release, dans une PR dédiée.
- Chaque version a une entrée dans [docs/RELEASES.md](docs/RELEASES.md), au format ci-dessous.
- Publier = pousser le tag `vX.Y.Z` sur le commit de `main` à publier
  (`git tag vX.Y.Z origin/main && git push origin vX.Y.Z`), ou lancer le workflow `image`
  à la main sur `main` avec la version `X.Y.Z` (onglet *Actions*, *Run workflow* ; c'est
  le chemin d'un agent qui ne peut pas pousser de tag). La CI vérifie, construit et
  pousse l'image sur `ghcr.io/zakmaf/zakmaf-site` sous `latest`, `vMAJEUR`,
  `vMAJEUR.MINEUR` et `vMAJEUR.MINEUR.PATCH`, puis crée la release GitHub avec la section
  de la version dans `docs/RELEASES.md`. Une préversion (`v1.1.0-rc.1`) est publiée comme
  telle et ne déplace pas `latest`.
- La CI refuse un tag qui ne correspond pas à la version de `package.json`, et une version
  sans entrée dans `docs/RELEASES.md`. Ne pas créer la release à la main sur GitHub : le
  workflow s'en charge.
- **Approbation obligatoire** : aucun agent (Claude, Codex, etc.) ne crée ni ne publie de
  release, ne crée ni ne pousse de tag, ne relance le workflow de publication ni ne déploie
  sans l'accord explicite du propriétaire du dépôt, demandé à chaque fois.

### États de publication

Chaque état se vérifie séparément, jamais par déduction du précédent :

1. **Source préparée** : version mise à jour dans `package.json`, entrée ajoutée dans
   `docs/RELEASES.md`, PR fusionnée dans `main`. Rien n'est publié.
2. **Tag poussé** : le tag `vX.Y.Z` existe ; il déclenche `image.yml`.
3. **Image et release publiées** : le run de `image.yml` sur le tag est vert, les tags
   existent sur GHCR (onglet *Packages*) et la release GitHub est créée.
4. **Production déployée** : le serveur exécute la nouvelle image (nouveau tirage de l'image
   épinglée) et le pied de page du site affiche la nouvelle version. Action hors dépôt, faite
   par le propriétaire.

### Checklist avant release

Chaque point se vérifie avec la commande réellement exécutée :

- [ ] `npm ci && npm run build` passe en local (mode hors ligne)
- [ ] `node -p "require('./package.json').version"` donne la version visée
- [ ] `docs/RELEASES.md` contient l'entrée de la version, conforme au format
- [ ] La CI de `main` est verte sur le commit à publier

### Rédaction des notes de version

Les notes s'adressent au lecteur du site comme à l'opérateur du serveur.

```markdown
## vX.Y.Z - AAAA-MM-JJ

### Nouveautés
### Améliorations
### Correctifs
### Sécurité
### Mise à jour de la stack
### Migration
```

- Français. Une ligne par changement, commençant par un verbe au présent (`Ajoute`, `Corrige`,
  `Passe`) ou par le nom de la fonctionnalité.
- Décrire l'effet visible, pas les fichiers ou fonctions modifiés.
- Citer l'issue en fin de ligne (`#XX`) quand elle existe ; chiffrer les gains quand c'est
  pertinent.
- Omettre les sections vides, sauf **Migration**, toujours présente : actions à faire sur le
  serveur, ou « Aucune action requise », et la commande `docker pull` du tag exact.
- Ni tiret cadratin ni émoji.

## Signaler une vulnérabilité

Pas d'issue publique : utiliser le signalement privé de GitHub (onglet *Security*,
*Report a vulnerability*).

## Licence

En contribuant, vous acceptez que votre code soit publié sous la licence du dépôt
(fichier `LICENSE`). Le portrait, le nom du site et son identité visuelle ne sont pas
couverts par cette licence.
