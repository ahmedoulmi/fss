# Site web Gmedic

Site statique de cinq pages pour **Gmedic**, groupement de pharmacies d'officine
en Algérie. Aucun générateur, aucune dépendance, aucune étape de build : ce sont
des fichiers HTML/CSS servis tels quels.

## Structure

```
gmedic/
├── index.html                Accueil
├── poles/index.html          Les huit pôles (vue d'ensemble + ancres par pôle)
├── fonctionnement/index.html Comment se déroule une opération
├── adherer/index.html        Profil attendu, période d'essai, principe tarifaire
├── contact/index.html        Formulaire + coordonnées
├── 404.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css         Feuille de style unique
    ├── js/nav.js             Menu mobile — seul script du site
    └── img/logo.svg
```

## Prévisualiser en local

Les liens sont **relatifs** : le site fonctionne aussi bien à la racine d'un
domaine (`gmedic.dz/`) que dans un sous-dossier (`exemple.com/fss/`). Il faut
en revanche le servir par HTTP, pas l'ouvrir en `file://` — sinon les URLs de
dossier (`poles/`) ne trouvent pas leur `index.html`.

```sh
cd gmedic
python3 -m http.server 4000
# puis http://localhost:4000
```

## Mise en ligne

### GitHub Pages (déploiement automatique)

Le dépôt contient `.github/workflows/pages.yml` : à chaque push sur `main`
touchant `gmedic/`, le dossier est publié tel quel sur GitHub Pages.

À faire une seule fois, dans **Settings → Pages** du dépôt : choisir
**Source : GitHub Actions**. Le site est alors servi sur
`https://<compte>.github.io/<dépôt>/`. Le workflow peut aussi être lancé à la
main depuis l'onglet **Actions** (« Run workflow »).

### Autre hébergeur

N'importe quel hébergeur statique convient (Netlify, Cloudflare Pages, un
simple Nginx) : publier le contenu de `gmedic/`. Le fichier `404.html` sert de
page d'erreur.

Avant la mise en ligne définitive, remplacer le domaine d'exemple
`https://www.gmedic.dz/` par le domaine réel dans :

- les balises `<link rel="canonical">` et `og:url` des cinq pages ;
- `robots.txt` et `sitemap.xml` ;
- les données structurées `Organization` de `index.html`.

Ces valeurs n'ont pas d'effet sur l'affichage : une prévisualisation sur
GitHub Pages fonctionne sans y toucher.

## Formulaire de contact

`contact/index.html` poste vers un point d'envoi externe, sans base de données
ni outil de suivi. L'identifiant est un espace réservé :

```html
<form class="form" action="https://formspree.io/f/VOTRE_ID" method="post">
```

Remplacer `VOTRE_ID` par l'identifiant du formulaire Formspree (ou l'URL d'un
service équivalent). Le champ `_gotcha`, masqué, sert de piège à robots ; le
champ `_subject` fixe l'objet du courriel reçu.

Tant que `VOTRE_ID` n'est pas remplacé, l'envoi échoue : le numéro affiché à
côté du formulaire reste le moyen de contact opérationnel.

## Choix techniques

**Typographie — pile système, aucun téléchargement.** Le brief demande des
équivalents libres d'Arial Bold / Calibri. Charger Inter ou Manrope depuis un
CDN ajouterait un tiers et des dizaines de kilo-octets sur des connexions
parfois lentes ; la pile système (Roboto sur Android, SF sur iOS, Segoe UI sur
Windows) donne le même contraste de graisse pour zéro octet. Pour basculer sur
des polices auto-hébergées, poser les fichiers `.woff2` dans
`assets/fonts/`, ajouter les `@font-face` en tête de `style.css` et changer les
deux variables `--font-title` / `--font-body`.

**Poids.** Quatre requêtes par page (HTML, CSS, JS, favicon SVG) et un maximum
de 41 Ko bruts, soit moins de 10 Ko compressés — pour une cible fixée à 500 Ko.
Aucune image bitmap, aucune police téléchargée, un seul script de ~1 Ko. Le
motif décoratif est fait de cercles CSS qui débordent du cadre.

**Accessibilité.** Lien d'évitement, navigation au clavier avec styles de focus
visibles, `aria-current` sur la page active, `aria-expanded` sur le menu
mobile, hiérarchie de titres continue. Les contrastes visent AA : le vert
principal `#1E8F3C` est réservé aux aplats, filets et grands titres ; le texte
d'accent et les boutons utilisent le vert foncé `#0B5227` (9,3:1 sur blanc).
Le gris secondaire `#6B7671` n'est employé que sur fond blanc.

**Préparation RTL.** Toute la feuille de style utilise des propriétés logiques
(`margin-inline`, `inset-inline-start`, `padding-block`…). Une version arabe se
fera en ajoutant `dir="rtl" lang="ar"` sur `<html>` et un jeu de pages
traduites, sans réécrire la mise en page. Le contenu arabe n'est pas demandé.

**Pas de suivi.** Ni Google Analytics, ni pixel publicitaire, ni police
distante : aucune requête vers un tiers, hors l'envoi du formulaire.

## Contenu

Tout le texte provient du brief. Les seuls ajouts sont des libellés de
navigation et de liaison (intitulés de menu, textes de boutons, titres de
sections de renvoi). Conformément au brief, le site ne comporte **aucun
montant**, **aucun nom de fournisseur**, **aucun chiffre de taille du réseau**
et **aucun témoignage**. L'architecture à deux niveaux est préservée : les
services sont présentés à l'intérieur de leur pôle, jamais à plat.
