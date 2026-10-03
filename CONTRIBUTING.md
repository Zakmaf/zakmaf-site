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

## Intégration et publication

Le workflow `.github/workflows/image.yml` enchaîne :

1. `secrets` : gitleaks sur tout l'historique ;
2. `check` : `npm ci` puis construction hors ligne ;
3. `build` : construction de l'image Docker, publiée sur
   `ghcr.io/zakmaf/zakmaf-site` (tags `latest` et `sha-<court>`) uniquement après
   fusion dans `main`.

L'image ne contient que le code et ses dépendances : le site est généré au démarrage du
conteneur, sur le serveur. La mise en production reste une action manuelle du mainteneur
(nouveau tirage de l'image) ; un retour arrière se fait en épinglant un tag `sha-<court>`.

Dependabot propose les mises à jour une fois par mois. Les versions mineures et les
correctifs sont fusionnés automatiquement une fois la CI verte ; les versions majeures
sont relues à la main.

## Signaler une vulnérabilité

Pas d'issue publique : utiliser le signalement privé de GitHub (onglet *Security*,
*Report a vulnerability*).

## Licence

En contribuant, vous acceptez que votre code soit publié sous la licence du dépôt
(fichier `LICENSE`). Le portrait, le nom du site et son identité visuelle ne sont pas
couverts par cette licence.
