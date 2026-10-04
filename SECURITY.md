# Politique de sécurité

## Versions supportées

Seule la dernière version publiée reçoit des correctifs (image `ghcr.io/zakmaf/zakmaf-site`,
tags `latest` et majeure en cours). Les versions antérieures ne sont pas maintenues.

## Signaler une vulnérabilité

N'ouvrez pas d'issue publique. Utilisez le signalement privé de GitHub : onglet *Security*
du dépôt, puis *Report a vulnerability*.

Merci d'indiquer, autant que possible :

- la description de la faille et son impact ;
- les étapes pour la reproduire ;
- la version concernée (affichée dans le pied de page du site, ou tag de l'image) ;
- une piste de correctif, si vous en avez une.

## Périmètre

Ce dépôt couvre le code du site et de son image Docker. L'instance Ghost, le serveur et
le reverse proxy sont hors périmètre : ils ne sont pas publics et leur configuration n'est
pas dans ce dépôt.
