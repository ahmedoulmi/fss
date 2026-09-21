# Export du contenu — massardevelopment.com

Export fidèle, destiné à un audit réalisé ailleurs. Aucun texte n'a été
corrigé, reformulé ni résumé. Les fautes, les espaces manquants et les
doublons sont reportés tels quels. Ce qui est introuvable est écrit
« absent ».

---

## 1. En-tête de l'export

### Date

Export réalisé le **21 septembre 2026**.

### Dépôt, branche, commit

Le site ne se trouve pas dans le dépôt `ahmedoulmi/fss`. Il est dans le dépôt
privé **`ahmedoulmi/massar-site`**, attaché à cette session et cloné pour la
lecture.

| | |
|---|---|
| Dépôt du site | `ahmedoulmi/massar-site` |
| Branche | `main` |
| Commit | `48f23ad` (`48f23ad09f17653722782d11035906f21b4f3be3`) |
| Date du commit | 11 septembre 2026, 05:56:49 +0100 |
| Message du commit | `Essai fait : hPanel n'est pas corrige, declencheur resuspendu` |

Le présent fichier est déposé, lui, à la racine du dépôt `ahmedoulmi/fss`,
branche `claude/export-contenu-site-flqtp8` (dernier commit `f874d07`), qui
est le dépôt de travail désigné pour cette tâche.

### Ce commit est-il celui qui est en ligne ?

**Impossible à vérifier directement.** La requête vers
`https://massardevelopment.com/` a été refusée par la politique réseau de
l'environnement d'exécution : `connect_rejected`, la passerelle répond 403 au
CONNECT. Aucune comparaison avec la page réellement servie n'a donc pu être
faite.

Les éléments vérifiables dans le dépôt, sans en tirer de conclusion sur
l'état réel du serveur :

- L'empreinte SHA-256 de `site/index.html` à ce commit est
  `d5ea150ae15394cfc5c59523e52742f2300555bb59413855c31200936365e216`
  (82 237 octets).
- Le déclenchement automatique du workflow de déploiement est **suspendu**
  dans `.github/workflows/deploiement.yml` : le bloc `push:` est commenté,
  seul `workflow_dispatch` reste actif.
- Historique des exécutions du workflow « Déployer le site » : 16 exécutions
  au total. La dernière, n° 16 du 11 septembre 2026 04:55 UTC, sur le commit
  `d1212a0`, s'est terminée en **échec**. La seule exécution conclue en
  succès est la n° 8 du 6 septembre 2026, et le dépôt lui-même la qualifie
  ensuite de faux succès (commit « Refuser de publier dans le vide » :
  « Le televersement precedent s'est declare en succes, le site n'a pas bouge
  d'un octet, et rien ne l'a dit »).
- Le commit courant `48f23ad` n'apparaît dans aucune exécution du workflow.
- `ETAT-DEPLOIEMENT.md` est absent de la racine du dépôt. Le workflow dépose
  ce fichier en cas d'échec et l'efface après un succès.
- `site/version.txt` contient : `Publiee le : 2026-09-11` —
  `Correctif du 9 septembre 2026.`
- `README.md`, section « Ce qui bloque aujourd'hui — à réparer dans hPanel » :
  « **Le compte FTP n'est pas rattaché à la racine du site.** Le déclenchement
  automatique est donc **suspendu** dans le workflow ».

### Build de production

**Absent.** Le dépôt ne comporte aucune étape de construction : pas de
`package.json`, pas de `Makefile`, pas de script de build, pas de dossier
`dist/`, pas de dossier `src/` ni `public/`.

Le site est un fichier statique unique. Le dossier publié est `site/`, et le
workflow de déploiement le téléverse **tel quel** par FTPS
(`local-dir: ./site/`). `site/index.html` est donc à la fois la source et le
rendu réel : tout y est en ligne — les styles dans une balise `<style>` en
tête, le script dans une balise `<script>` en pied. Aucun fichier CSS ou JS
externe n'est servi depuis le domaine.

Il n'y a donc **aucune sortie générée à extraire** : ce qui suit est extrait
du fichier qui part en ligne.

### Erreurs ou avertissements du build

Sans build, il n'y a pas de sortie de build. Le workflow exécute en revanche
trois contrôles de contenu avant téléversement. Résultat de ces contrôles sur
le commit courant :

| Contrôle | Résultat |
|---|---|
| Vocabulaire proscrit (`groupement`, `achat group`, `centrale`, `GIE`, `du groupe`, `Massar Group`, `mandat`, `mutualis` hors démenti) | aucun terme trouvé |
| Marqueurs `À REMPLIR` restants | aucun |
| Signature : occurrences de « écosystème » dans `site/index.html`, plafond 6 | **6** occurrences, à la limite du plafond |

### Liste de toutes les routes générées

Le dossier déployé, `site/`, contient :

| Route | Fichier | Remarque |
|---|---|---|
| `/` | `site/index.html` | page unique, 82 237 octets |
| `/envoi.php` | `site/envoi.php` | point de réception du formulaire, `Disallow` dans robots.txt |
| `/robots.txt` | `site/robots.txt` | |
| `/sitemap.xml` | `site/sitemap.xml` | |
| `/version.txt` | `site/version.txt` | fichier témoin, hors navigation |
| `/assets/…` | 14 fichiers | images et vidéos, listés en §5 |

- **Page 404** : **absente**. Aucun `404.html` dans `site/`.
- **Routes `/ar/`** : **absentes**. Le site est en français
  (`<html lang="fr" dir="ltr">`). L'arabe n'apparaît que dans deux fragments
  de texte marqués `lang="ar"` ou décrits dans un `alt`, à l'intérieur de la
  page française.
- **Pages de test** : **absentes du dossier déployé**. Le dépôt contient trois
  maquettes alternatives complètes — `modeles/model-1/`, `modeles/model-2/`,
  `modeles/model-3/`, chacune avec `index.html`, `envoi.php` et
  `assets/logo-massar.png` — mais elles sont **hors de `site/`** et ne sont
  donc jamais téléversées. Elles ne sont pas couvertes par cet export.
- **Manifeste (`manifest.json` / `site.webmanifest`)** : **absent**.

---

## 2. Page unique — `/`

### 2.1 En-tête HTML

| Élément | Valeur |
|---|---|
| `title` | `Massar Development (مسار التطور), services aux pharmacies d'officine en Algérie` |
| `meta description` | `Massar Development (مسار التطور) structure huit pôles de services pour les pharmacies d'officine en Algérie : négociation des conditions d'achat, gestion des stocks, pilotage par la donnée, formation et conseil.` |
| `canonical` | **absent** |
| `lang` | `fr` (sur `<html>`, avec `dir="ltr"`) |
| `meta charset` | `utf-8` |
| `meta viewport` | `width=device-width, initial-scale=1, viewport-fit=cover` |
| `meta theme-color` | `#07160E` |
| `meta robots` | **absent** |

**Open Graph**

| Propriété | Contenu |
|---|---|
| `og:type` | `website` |
| `og:site_name` | `Massar Development` |
| `og:title` | `Plus qu'un service, un écosystème` |
| `og:description` | `Les remises négociées sont versées directement à votre officine. Massar n'y touche jamais.` |
| `og:url` | `https://massardevelopment.com/` |
| `og:image` | `https://massardevelopment.com/assets/og.jpg` |
| `og:locale` | `fr_FR` |

**Twitter**

| Nom | Contenu |
|---|---|
| `twitter:card` | `summary_large_image` |
| `twitter:title` | `Plus qu'un service, un écosystème` |
| `twitter:description` | `Les remises négociées sont versées directement à votre officine. Massar n'y touche jamais.` |
| `twitter:image` | `https://massardevelopment.com/assets/og.jpg` |
| `twitter:site` / `twitter:creator` | **absents** |

**Icônes et liens de tête**

- `<link rel="icon" href="assets/logo-massar.png" type="image/png">`
- `<link rel="apple-touch-icon" href="assets/logo-massar.png">`
- `<link rel="preconnect" href="https://fonts.googleapis.com">`
- `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Carlito:wght@400;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@500&display=swap">` — seule ressource tierce chargée par la page (Google Fonts)

---

### 2.2 Lien d'évitement

> **Aller au contenu** — lien vers `#main`

[MASQUÉ] — `.skip{position:absolute;inset-block-start:-100px}` : le lien est
positionné hors de l'écran.
[INTERACTION] — il descend à l'écran (`inset-block-start:.75rem`) lorsqu'il
**reçoit le focus au clavier** (`.skip:focus`), c'est-à-dire à la première
tabulation sur la page.

---

### 2.3 Héro (`#hero`)

Section portant `aria-label="Massar Development"`.

Le héro existe en **deux versions mutuellement exclusives** dans le même
document. Les deux sont présentes dans le HTML livré ; seule l'une des deux
est affichée, selon la largeur, l'orientation, le type de pointeur et la
préférence de mouvement réduit.

#### 2.3.1 Version défilante — les quatre bandes

Affichée sur grand écran, pointeur fin, mouvement non réduit.

[INTERACTION] — les quatre bandes ne sont pas montrées ensemble : leur
opacité est pilotée par **le défilement de la page** dans le héro (haut de
600 vh). Chaque bande a une fenêtre de progression (`data-a`, `data-b`) et
son texte est découpé lettre par lettre puis recomposé à mesure qu'on défile.
Une vidéo, `assets/hero-scrub.mp4`, est avancée image par image au même
rythme.

Textes, dans l'ordre d'apparition :

- Bande 1 (0 → 0,22)
  - surtitre : **Pharmacies d'officine, Algérie**
  - texte : **Seule, une officine subit sa trajectoire.**
- Bande 2 (0,26 → 0,50)
  - texte : **La remise est promise. Où elle finit, personne ne vous le dit.**
- Bande 3 (0,54 → 0,76)
  - texte : **Ici, elle est versée directement à votre officine. Massar n'y touche jamais.**
- Bande 4 (0,80 → 1)
  - **h1** : **Plus qu'un service, un écosystème.**
  - texte : **Massar Development, services aux pharmacies d'officine en Algérie.**
  - bouton : **Demander un entretien** → `#entretien`

Ces quatre textes sont portés dans le HTML par des attributs `data-texte` sur
des éléments **vides**. Le script les injecte au chargement, en double : une
copie visible découpée en `<span>` par lettre et marquée `aria-hidden="true"`,
et une copie en texte continu dans un `<span class="sr">`.

[LECTEUR D'ÉCRAN] — la copie `.sr` est masquée visuellement
(`position:absolute;inline-size:1px;block-size:1px;clip-path:inset(50%)`) et
reprend mot pour mot les quatre textes ci-dessus. C'est elle qui est lue.

[MASQUÉ] — sous `(max-width:720px)`, ou en orientation portrait jusqu'à
1024 px, ou sur pointeur grossier en portrait, ou en paysage sur pointeur
grossier sous 560 px de haut, ou en `prefers-reduced-motion: reduce` :
`.bandes,.anneau,.chevron,.voile{display:none}` et `.scene video{display:none}`.
Toute la version défilante disparaît.

#### 2.3.2 Version fixe

Affichée exactement dans les cas où la version défilante est masquée, ci-dessus.

- surtitre : **Services aux pharmacies d'officine, Algérie**
- **h1** : **Plus qu'un service, un écosystème.**
- texte : **Les remises négociées sont versées directement à votre officine. Massar n'y touche jamais.**
- bouton : **Demander un entretien** → `#entretien`

[MASQUÉ] — `.fixe{display:none}` par défaut : sur grand écran, ce bloc et son
`h1` ne sont pas affichés. Le document contient donc **deux `h1` au même
texte**, dont un seul est visible à la fois.

#### 2.3.3 Éléments non textuels du héro

- `<div class="affiche">`, `<video id="film">`, `<div class="voile">`,
  `<svg class="anneau">` : tous `aria-hidden="true"`, sans texte.
- L'anneau est un indicateur de chargement de la vidéo. En cas d'échec, il
  est remplacé par un chevron SVG, sans texte non plus.

---

### 2.4 Section 1 — Ce que Massar change (`#garanties`)

- surtitre : **Ce qui change pour votre officine**
- **h2** : **Trois choses ne bougent pas, et ce sont les trois qui comptent.**

| Badge | h3 | Texte |
|---|---|---|
| **01** | **Vos remises restent les vôtres** | Les remises négociées auprès des laboratoires sont versées directement à votre officine. Massar ne manipule jamais ces fonds. |
| **02** | **Votre facturation reste la vôtre** | Chaque officine est facturée individuellement. Aucune mutualisation, aucune facture commune. |
| **03** | **Un circuit conforme** | L'approvisionnement passe par les grossistes-répartiteurs, comme le prévoit la réglementation. Massar ne se substitue à aucun acteur du circuit. |

[INTERACTION] — le tracé SVG décoratif de la section (`.epine`) se dessine au
défilement ; le bloc `.rev` bascule en classe `in` à l'entrée dans le champ de
vision. Aucun texte n'est révélé par là : sans script, tout est déjà lisible.

---

### 2.5 Section 2 — Ce que vous gardez (`#garde`)

- surtitre : **L'objection numéro un d'un titulaire**
- **h2** : **Vous restez maître de votre officine.**

**h3 : Ce qui reste à vous**

- La propriété
- La gouvernance et la direction
- Les finances et les résultats
- Le personnel et l'organisation
- Le réassort courant

**h3 : Ce que porte Massar**

- La politique de négociation auprès des laboratoires et des grossistes
- Les conditions négociées
- L'outil qui consolide les besoins du réseau
- Rien d'autre

**Image**

- fichier : `assets/appui-garde.jpg`
  (`srcset` : `assets/appui-garde-800.jpg 800w`, `assets/appui-garde.jpg 1600w`)
- **alt vide** (`alt=""`), `loading="lazy"`, 1600 × 894

---

### 2.6 Section 3 — Les huit pôles (`#poles`)

- surtitre : **L'offre**
- **h2** : **Huit pôles, une trajectoire.**
- chapô : **Massar structure son offre sur deux niveaux. Les pôles sont les divisions structurantes du réseau. À l'intérieur de chaque pôle, des services répondent à un besoin précis de l'officine. Les deux niveaux ne se recouvrent pas.**
- encadré : **Trois pôles sont communs à tous les adhérents : Massar Core, Massar Analytics et Massar Digital.**

| Badge | h3 | Texte | Étiquette |
|---|---|---|---|
| **01** | **Massar Core** | Plan de négociation et conditions d'approvisionnement. | **Pôle commun** |
| **02** | **Massar Inventory** | Maîtrise physique du stock. | — |
| **03** | **Massar Analytics** | Vos tableaux de bord, et la comparaison entre les remises obtenues et les conditions négociées. | **Pôle commun** |
| **04** | **Massar Exchange** | Circulation entre adhérents. | — |
| **05** | **Massar Academy** | Formation des équipes. | — |
| **06** | **Massar Consulting** | Expertise et accompagnement. | — |
| **07** | **Massar Digital** | Outils et infrastructure. Le pôle porte la solution Massar Soft, reliée à votre logiciel d'officine par Massar Connect. Massar Connect lit les données de votre logiciel, sans jamais y écrire. Les documents établis dans Massar Soft vous sont remis en fichiers à charger dans votre logiciel. | **Pôle commun** |
| **08** | **Massar Invest** | Fonds d'investissement. | **En préparation** |

**Bloc « tracer »**

- texte : **La trajectoire des huit pôles**
- une jauge (`.tracer-piste` / `.tracer-jauge`), `aria-hidden="true"`, sans texte.

[INTERACTION] — la jauge se remplit d'elle-même en ~1,9 s à l'arrivée de la
section dans le champ de vision, et **rejoue au survol à la souris**
(`mouseenter`, uniquement sur `(hover: hover) and (pointer: fine)`). À mesure
qu'elle avance, les cartes des pôles s'allument une à une (classe `allume`).
L'appui maintenu a été retiré, d'après le commentaire du code. Sans
JavaScript, la barre est pleine dès le départ : aucun texte n'en dépend.

---

### 2.7 Section 4 — Massar Exchange (`#exchange`)

- surtitre : **Le service que personne d'autre ne propose**
- **h2** : **Massar Exchange. La circulation entre adhérents.**
- texte : **Un surstock chez vous est une rupture chez un autre. La plateforme d'échange met les deux en relation : surstocks, dates courtes, dépannage sur rupture. Chaque mouvement est tracé et encadré.**

**Image**

- `assets/appui-exchange.jpg` — image de fond CSS d'un `<div aria-hidden="true">`.
  **alt absent** : ce n'est pas une balise `<img>`.
- variante sous 760 px : `assets/appui-exchange-800.jpg`.

---

### 2.8 Section 5 — La preuve, les sept composantes (`#ecosysteme`)

- surtitre : **La preuve**
- **h2** : **L'écosystème annoncé, en sept composantes.**

**h3 : Acteurs**

- **01** Laboratoires et fournisseurs
- **02** Pharmaciens adhérents
- **03** Services financiers

**h3 : Solutions**

- **04** Solutions digitales
- **05** Gestion et performance
- **06** Formation continue
- **07** Marketing et communication

---

### 2.9 Section 6 — Nos engagements (`#engagements`)

- surtitre : **Nos engagements**
- **h2** : **Six engagements que vous pouvez nous opposer.**

- **01** Défendre les intérêts économiques des pharmaciens
- **02** Sélectionner des partenaires fiables et performants
- **03** Développer des services innovants
- **04** Accompagner la transformation digitale des officines
- **05** Favoriser la montée en compétences des équipes
- **06** Créer un réseau fondé sur l'entraide et le partage

---

### 2.10 Section 7 — Nos valeurs (`#valeurs`)

- surtitre : **Nos valeurs**
- **h2** : **Une valeur seule ne vaut rien. Chacune arrive avec sa preuve.**

Liste de définitions (`dl` / `dt` / `dd`) :

| Terme | Définition |
|---|---|
| **Partenariat** | Les remises sont versées directement à votre officine. |
| **Innovation** | Tableaux de bord et solutions numériques. |
| **Performance** | Indicateurs de suivi et mesure des ventes. |
| **Proximité** | Échange entre officines adhérentes. |
| **Excellence** | Formation continue des équipes. |

---

### 2.11 Section 8 — Comment ça commence (`#commencer`)

- surtitre : **L'adhésion**
- **h2** : **Comment ça commence. Quatre temps.**

| h3 | Texte |
|---|---|
| **L'entretien** | Présentation de la convention et de la grille des paliers. Le plafond du forfait est connu avant signature. |
| **Un mois d'essai** | Aucun forfait, aucun engagement de volume, accès au socle. Chacune des deux parties peut se retirer, et vous pouvez passer à l'adhésion pleine à tout moment. |
| **L'objectif est arrêté** | À l'issue du mois d'essai, avec vous, au prorata en cas d'entrée en cours d'exercice. |
| **L'exercice** | De janvier à décembre. Le seuil est réexaminé chaque année, avec un préavis de deux mois pour ne pas reconduire. |

---

### 2.12 Section 9 — Ce que vous payez (`#payer`)

- surtitre : **La grille**
- **h2** : **Ce que vous payez.**

**h3 : Le socle, dû par tout adhérent**

- **Massar Core**, par paliers sur le volume d'achat annuel
- **Massar Analytics**,forfait fixe annuel
- **Massar Digital**,abonnement fixe

**h3 : Les cinq autres pôles, à l'usage**

- **Massar Inventory**,au nombre d'inventaires et au volume de stock
- **Massar Exchange**,au nombre d'échanges
- **Massar Academy**,par formation suivie
- **Massar Consulting**,par mission
- **Massar Invest**,part de gérance fixée d'avance

> Relevé sans correction : sept de ces huit items n'ont **pas d'espace après
> la virgule** qui suit le nom du pôle. Seul « **Massar Core**, par paliers… »
> en a une. Le texte est reporté tel qu'il est dans le fichier livré.

- texte de fermeture : **Rien n'est dû sur un pôle optionnel tant qu'il n'est pas utilisé. Les paliers et les forfaits sont réexaminés à chaque exercice, et le plafond vous est communiqué avant le début de l'exercice. L'objectif de volume et les paliers portent sur l'exercice annuel ; les cotisations sont appelées par trimestre, payables d'avance, et facturées individuellement à votre officine.**

---

### 2.13 Section 10 — La transparence, écrite (`#transparence`)

- surtitre : **La transparence, écrite**
- texte : **Massar n'est rémunéré que par ses adhérents. Les remises négociées sont versées directement par le fournisseur, et Massar ne prélève rien au passage. Si une rémunération fournisseur devait un jour être négociée, elle vous serait déclarée et viendrait en diminution du forfait, jamais en supplément.**

Pas de `h2` dans cette section : le surtitre est un `<span>`.

**Image**

- `assets/appui-transparence.jpg` — image de fond CSS du bloc `.declare`.
  **alt absent** : ce n'est pas une balise `<img>`.
- variante sous 760 px : `assets/appui-transparence-800.jpg`.

---

### 2.14 Section 11 — Ce que Massar ne fait pas (`#nefaitpas`)

- surtitre : **Les limites, dites à l'avance**
- **h2** : **Ce que Massar ne fait pas.**

- Massar ne vend aucun produit et ne se substitue pas à votre grossiste-répartiteur.
- Massar n'encaisse pas les remises laboratoires. Elles sont versées directement à votre officine.
- Massar ne mutualise pas la facturation. Chaque officine reste facturée individuellement.
- Massar ne passe aucune commande pour votre compte. Chaque officine commande auprès de son grossiste-répartiteur, qui la facture individuellement.
- La gérance juridique de l'officine ne relève pas de la convention d'adhésion. Elle fait l'objet d'un contrat distinct.

---

### 2.15 Section 12 — Ce que Massar attend (`#attend`)

- surtitre : **De votre côté**
- **h2** : **Ce que Massar attend d'un adhérent.**

| Intitulé (`<b>`) | Texte |
|---|---|
| **Une officine saine** | Capable de tenir ses engagements dans la durée. |
| **Une réputation établie** | Un exercice professionnel reconnu par ses pairs. |
| **Le goût du collectif** | L'acceptation des arbitrages du réseau sur la politique de négociation. |
| **L'envie de développer** | Une officine qui veut avancer, et de l'aisance avec les outils informatiques. |

---

### 2.16 Section 13 — Questions fréquentes (`#questions`)

- surtitre : **Questions fréquentes**
- **h2** : **Les questions que les titulaires posent en premier.**

Huit blocs `<details>` / `<summary>`. Les questions sont visibles ; **les
réponses sont fermées à l'ouverture de la page**.

[INTERACTION] — chaque réponse n'apparaît qu'après **un clic (ou une
activation au clavier) sur la question**. Le marqueur natif est supprimé et
remplacé par un `+` en pseudo-élément CSS (`content:"+"`), qui pivote de 45°
à l'ouverture. Ce `+` est un contenu généré : il n'est pas dans le HTML.

**1. Qui touche les remises négociées ?**
[INTERACTION] Votre officine, directement. Le fournisseur verse la remise à l'officine. Massar ne manipule jamais ces fonds et ne prélève rien au passage.

**2. Est-ce que je perds la main sur mon officine ?**
[INTERACTION] Non. La propriété, la gouvernance, les finances, le personnel et le réassort courant restent les vôtres. Massar porte la politique de négociation et l'outil qui consolide les besoins du réseau. Rien d'autre.

**3. Le coût final peut-il dépasser ce qui m'a été annoncé ?**
[INTERACTION] Non. Le plafond du forfait est connu avant signature. Rien n'est dû sur un pôle optionnel tant qu'il n'est pas utilisé, et les paliers sont réexaminés à chaque exercice.

**4. Suis-je engagé sur un volume d'achat ?**
[INTERACTION] Pas pendant l'essai. Vous signez la convention, pas encore un volume — votre seule décision est de commencer.
[INTERACTION] À l'issue du mois d'essai, un objectif annuel est arrêté avec vous, au prorata si vous entrez en cours d'exercice. Il est réexaminé chaque exercice, et le plafond du forfait vous est communiqué avant le début de l'exercice.
[INTERACTION] Si vous n'atteignez pas votre objectif, l'écart est absorbé par le réseau. Il ne vous est jamais reporté.

**5. Massar achète-t-il directement auprès des laboratoires ?**
[INTERACTION] Non. L'approvisionnement passe par les grossistes-répartiteurs, comme le prévoit la réglementation algérienne. Massar négocie les conditions, il ne se substitue à aucun acteur du circuit.

**6. Ma facturation sera-t-elle mélangée à celle des autres ?**
[INTERACTION] Non. Chaque officine est facturée individuellement, à son nom. Il n'y a aucune facture commune.

**7. Massar modifie-t-il mon logiciel de gestion ?**
[INTERACTION] Non. Massar Connect fonctionne en lecture seule. Les commandes, bons d'échange et inventaires établis dans Massar Soft vous sont remis en fichiers que vous chargez vous-même, quand cela vous convient.

**8. Que deviennent mes données si je quitte le réseau ?**
[INTERACTION] Vos données restent les vôtres. Si vous quittez le réseau, elles vous sont restituées dans un format standard exploitable, et vous pouvez en demander la suppression.

---

### 2.17 Sceau de marque (`#sceau`)

Section portant `aria-label="Massar Development"`. Aucun texte rédigé.

**Images**

- `<img class="sceau-fixe" src="assets/logo-anime-fin.jpg">`
  alt : **Massar Development, calligraphie arabe de مسار** — 960 × 540, `loading="lazy"`
- `<video id="logo-anime">`, `poster="assets/logo-anime-fin.jpg"`,
  `aria-hidden="true"` — **alt absent** (une vidéo n'a pas d'attribut `alt`).

[INTERACTION] — la vidéo `assets/logo-anime.mp4` n'est chargée par le script
que sur grand écran, hors mouvement réduit, et seulement **quand la bande
entre dans le champ de vision** ; elle remplace alors l'image fixe. Elle
**repart du début au passage du curseur** sur la boîte (`mouseenter`,
uniquement sur pointeur fin). Sur téléphone, en portrait sur pointeur
grossier, ou en `prefers-reduced-motion: reduce`, le film n'est jamais
chargé : seule l'image fixe reste.

---

### 2.18 Section 14 — Un mois pour juger (`#entretien`)

- surtitre : **L'essai**
- **h2** : **Un mois pour juger.**
- texte : **L'adhésion commence par un mois d'essai. Vous décidez ensuite, et vous pouvez passer à l'adhésion pleine à tout moment.**

#### Formulaire

`<form id="form" novalidate>` — sans attribut `action` ni `method` : l'envoi
est entièrement pris en charge par le script.

| Champ | Libellé (`<label>`) | Type | Placeholder | Obligatoire |
|---|---|---|---|---|
| `nom` | **Nom et prénom** | `text`, `autocomplete="name"` | **absent** | oui (`required`) |
| `officine` | **Nom de l'officine** | `text` | **absent** | oui (`required`) |
| `wilaya` | **Wilaya** | `text` | **absent** | oui (`required`) |
| `telephone` | **Téléphone** | `tel`, `inputmode="tel"`, `autocomplete="tel"` | **absent** | oui (`required`) |
| `email` | **E-mail** | `email`, `autocomplete="email"` | **absent** | oui (`required`) |
| `message` | **Message (facultatif)** | `textarea` | **absent** | non |
| `site` | **Ne pas remplir** | `text`, `tabindex="-1"`, `autocomplete="off"` | **absent** | non |

Aucun champ du formulaire ne porte de `placeholder`.

**Messages de validation, par champ**

Chaque champ obligatoire porte un message d'erreur, présent dans le HTML :

- `nom` : **Ce champ est nécessaire.**
- `officine` : **Ce champ est nécessaire.**
- `wilaya` : **Ce champ est nécessaire.**
- `telephone` : **Ce champ est nécessaire.**
- `email` : **Indiquez une adresse e-mail valable.**

[MASQUÉ] — ces cinq messages sont dans le document dès le chargement et ne
s'affichent que lorsque le champ concerné reçoit la classe `faux`.
[INTERACTION] — la classe est posée **à la soumission**, sur tout champ
`required` vide ou invalide, et retirée **à la première frappe** dans ce
champ. Le focus est alors déplacé sur le premier champ fautif.

**Champ piège (honeypot)**

- libellé : **Ne pas remplir** — champ `site`.

[MASQUÉ] — le bloc `.piege` est masqué visuellement
(`position:absolute;inline-size:1px;block-size:1px;clip-path:inset(50%)`) et
porte `aria-hidden="true"`. Il n'est ni visible ni annoncé ; seul un automate
le remplit. Côté serveur, s'il est rempli, la réponse est `{"ok":true}` sans
qu'aucun message ne soit envoyé.

**Bouton**

- **Demander un entretien** — `<button type="submit">`.

[INTERACTION] — pendant l'envoi, la classe `envoi-en-cours` le passe à
`opacity:.6` et `pointer-events:none`. Aucun changement de libellé.

**Message de confirmation**

> **Votre demande est enregistrée. Nous vous rappelons sous 48 heures.**

`role="status"`. [MASQUÉ] — `.merci{display:none}` par défaut.
[INTERACTION] — affiché seulement après une réponse `{"ok":true}` de
`envoi.php` (classe `envoye` sur le formulaire). À ce moment, les champs et
le bouton disparaissent (`form.envoye .champs,form.envoye .envoi{display:none}`),
et le focus est porté sur le message.

**Message d'erreur d'envoi**

> **L'envoi n'a pas abouti. Écrivez-nous directement à contact@massardevelopment.com.**
> (l'adresse est un lien `mailto:contact@massardevelopment.com`)

`role="alert"`. [MASQUÉ] — `.rate{display:none}` par défaut.
[INTERACTION] — affiché lorsque `envoi.php` ne répond pas `ok`, ou que la
requête échoue (classe `rate-envoi`). Le message est alors ramené dans le
champ de vision.

**Mention placée sous le formulaire**

> **Les informations transmises servent uniquement à traiter votre demande d'adhésion. Elles ne sont ni cédées ni utilisées à d'autres fins.**

**Service ou adresse qui reçoit l'envoi**

- Le script poste un `FormData` en `POST` vers **`envoi.php`**, sur le même
  domaine. Aucun service tiers.
- `envoi.php` n'enregistre rien et envoie un e-mail par la fonction `mail()`
  de PHP.
- Destinataire : **`contact@massardevelopment.com`**
- Expéditeur : **`contact@massardevelopment.com`**
- Réponses JSON du serveur, qui ne sont pas affichées telles quelles :
  - méthode autre que POST → HTTP 405, `{"ok":false,"erreur":"methode"}`
  - champ manquant ou e-mail invalide → HTTP 422, `{"ok":false,"champs":[…]}`
  - échec de `mail()` → HTTP 502, `{"ok":false,"erreur":"envoi"}`
  - succès → `{"ok":true}`
- Limites de longueur appliquées côté serveur : nom 120, officine 160,
  wilaya 80, téléphone 40, e-mail 160, message 4000 caractères.

**Éléments décoratifs**

Trois `<span class="cercle">`, tous `aria-hidden="true"`, sans texte.
[MASQUÉ] — `.cercle-3{display:none}` sous 1100 px.

---

## 3. Éléments communs, reportés une seule fois

### 3.1 En-tête et navigation (`<header class="tete">`)

**Marque** — lien vers `#top` :

- image : `assets/logo-massar.png`, alt : **Massar Development**, 120 × 146
- **Massar Development**
- **مسار التطور** — `lang="ar"`, `dir="rtl"`

[MASQUÉ] — le libellé arabe **مسار التطور** disparaît sous 520 px
(`@media (max-width:520px){.marque-sous{display:none}}`).

**Navigation** — `<nav aria-label="Navigation principale">` :

| Libellé | Destination |
|---|---|
| **Pôles** | `#poles` |
| **Adhésion** | `#commencer` |
| **Contact** | `#contact` |
| **Connexion** | `#` |

[MASQUÉ] — toute la navigation disparaît sous 900 px
(`@media (max-width:900px){.nav{display:none}}`). **Aucun menu de
remplacement n'est prévu** : il n'y a ni bouton hamburger ni menu déroulant
dans le document. Sous 900 px, les quatre liens ci-dessus sont inaccessibles.

[MASQUÉ] — le lien **Connexion** porte l'attribut HTML `hidden` : il n'est
affiché dans aucune configuration. Le commentaire du code l'explique :
« Phase 2 : bouton d'accès à l'ERP Massar Soft, présent dans le code, masqué
tant que l'ERP n'est pas déployé ». Sa destination est `#`.

**Bouton d'en-tête** — lien vers `#entretien`, avec deux libellés dans le
même élément :

- **Rejoindre le réseau** — `<span class="long">`
- **Adhérer** — `<span class="court">`

[MASQUÉ] — au-dessus de 520 px : `.court{display:none}`, seul
**Rejoindre le réseau** est visible.
[MASQUÉ] — sous 520 px : `.long{display:none}` et `.court{display:inline}`,
seul **Adhérer** est visible.

[INTERACTION] — au-delà de 60 px de défilement, l'en-tête prend la classe
`pose` : le fond s'opacifie et un filet apparaît. Aucun texte n'en dépend.

### 3.2 Pied de page (`<footer class="pied" id="contact">`)

**Colonne 1**

- image : `assets/logo-massar.png`, alt : **Massar Development**, 120 × 146, `loading="lazy"`
- texte : **Services aux pharmacies d'officine en Algérie.**

**Colonne 2 — h4 : Le site**

| Libellé | Destination |
|---|---|
| **Les huit pôles** | `#poles` |
| **Adhésion** | `#commencer` |
| **Questions fréquentes** | `#questions` |
| **Demander un entretien** | `#entretien` |

**Colonne 3 — h4 : Contact**

- **La direction de Massar Development** (texte, sans lien)
- **contact@massardevelopment.com** → `mailto:contact@massardevelopment.com`

**Bas de pied**

- **Massar Development, plus qu'un service, un écosystème.**

Le pied de page ne contient **aucune** mention légale, politique de
confidentialité, condition d'utilisation, adresse postale, numéro de
téléphone, lien de réseau social ni mention de copyright. Tous **absents**.

### 3.3 Récapitulatif — tous les liens et boutons de la page

| Libellé exact | Destination | Emplacement |
|---|---|---|
| Aller au contenu | `#main` | lien d'évitement |
| *(marque, sans libellé propre)* | `#top` | en-tête |
| Pôles | `#poles` | en-tête |
| Adhésion | `#commencer` | en-tête |
| Contact | `#contact` | en-tête |
| Connexion | `#` | en-tête, `hidden` |
| Rejoindre le réseau / Adhérer | `#entretien` | en-tête |
| Demander un entretien | `#entretien` | héro, version défilante |
| Demander un entretien | `#entretien` | héro, version fixe |
| Demander un entretien | *(bouton `submit`)* | formulaire |
| contact@massardevelopment.com | `mailto:contact@massardevelopment.com` | message d'erreur du formulaire |
| Les huit pôles | `#poles` | pied de page |
| Adhésion | `#commencer` | pied de page |
| Questions fréquentes | `#questions` | pied de page |
| Demander un entretien | `#entretien` | pied de page |
| contact@massardevelopment.com | `mailto:contact@massardevelopment.com` | pied de page |

Le libellé **Demander un entretien** apparaît **quatre fois** ; **Adhésion**
deux fois ; **contact@massardevelopment.com** deux fois. Aucun lien ne sort du
domaine, hormis la feuille de styles Google Fonts chargée en tête.

### 3.4 Récapitulatif — tous les `aria-label`, `title` et textes pour lecteurs d'écran

**`aria-label`** (3 occurrences, toutes identiques ou presque) :

- `<section class="hero" aria-label="Massar Development">`
- `<nav class="nav" aria-label="Navigation principale">`
- `<section class="sceau" aria-label="Massar Development">`

**Attributs `title`** : **absents**. Aucun élément de la page n'en porte.

**Textes réservés aux lecteurs d'écran** — `<span class="sr">`, générés par le
script à partir des attributs `data-texte`, quatre occurrences :

1. Seule, une officine subit sa trajectoire.
2. La remise est promise. Où elle finit, personne ne vous le dit.
3. Ici, elle est versée directement à votre officine. Massar n'y touche jamais.
4. Plus qu'un service, un écosystème.

**`aria-hidden="true"`** : **19 occurrences** dans le fichier livré — le voile
de fond `.monde`, l'affiche du héro, la vidéo `#film`, le voile, l'anneau de
chargement, le `<svg>` de dégradés, les **six** tracés `.epine`, la piste de
la jauge, le visuel Exchange, la vidéo du sceau, les trois cercles décoratifs
et le champ piège. Aucun ne porte de texte.

À l'exécution, le script en ajoute quatre de plus : les copies visuelles
découpées des quatre textes du héro, dont la version lisible est le
`<span class="sr">` correspondant.

**`role`** : `status` sur le message de confirmation, `alert` sur le message
d'erreur du formulaire. Aucun autre.

### 3.5 Récapitulatif — toutes les images et vidéos

| Fichier | Emplacement | alt |
|---|---|---|
| `assets/logo-massar.png` | en-tête | **Massar Development** |
| `assets/logo-massar.png` | pied de page | **Massar Development** |
| `assets/appui-garde.jpg` (+ `-800`) | section « Ce que vous gardez » | **alt vide** (`alt=""`) |
| `assets/logo-anime-fin.jpg` | sceau de marque | **Massar Development, calligraphie arabe de مسار** |
| `assets/hero-poster.jpg` | héro, fond CSS posé par le script | **alt absent** (fond CSS) |
| `assets/hero-ending.jpg` (+ `-800`) | héro fixe, fond CSS | **alt absent** (fond CSS) |
| `assets/appui-exchange.jpg` (+ `-800`) | section Exchange, fond CSS | **alt absent** (fond CSS) |
| `assets/appui-transparence.jpg` (+ `-800`) | section transparence, fond CSS | **alt absent** (fond CSS) |
| `assets/og.jpg` | `og:image` et `twitter:image` | **alt absent** (`og:image:alt` non renseigné) |
| `assets/hero-scrub.mp4` | héro défilant, 3,7 Mo | **alt absent** (vidéo, `aria-hidden="true"`) |
| `assets/logo-anime.mp4` | sceau de marque, 819 Ko | **alt absent** (vidéo, `aria-hidden="true"`) |

### 3.6 `robots.txt`, en entier

```
User-agent: *
Allow: /
Disallow: /envoi.php

Sitemap: https://massardevelopment.com/sitemap.xml
```

### 3.7 `sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://massardevelopment.com/</loc>
    <lastmod>2026-09-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

Liste des URL : **une seule** — `https://massardevelopment.com/`.

### 3.8 Manifeste

**Absent.** Ni `manifest.json`, ni `site.webmanifest`, ni balise
`<link rel="manifest">`.

### 3.9 `version.txt`

```
Massar Development
Publiee le : 2026-09-11
Correctif du 9 septembre 2026.
```

### 3.10 E-mail envoyé par le formulaire

Produit par `site/envoi.php`. Un seul e-mail, vers
`contact@massardevelopment.com`.

**Objet** — encodé en base64 UTF-8 (`=?UTF-8?B?…?=`), texte en clair :

```
Demande d'entretien - {officine} ({wilaya})
```

**En-têtes**

```
From: Massar Development <contact@massardevelopment.com>
Reply-To: {nom} <{email}>
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit
MIME-Version: 1.0
```

**Corps** — texte brut, `{…}` marquant les valeurs saisies :

```
Nouvelle demande d'entretien
----------------------------------

Nom et prenom : {nom}
Officine      : {officine}
Wilaya        : {wilaya}
Telephone     : {tel}
E-mail        : {email}

Message :
{message}   ← ou « (aucun) » si le message est vide

----------------------------------
Recu le {jj/mm/aaaa} a {HH:MM} via massardevelopment.com
```

Le corps du message est sans accents, tel quel dans le code source.
Aucun accusé de réception n'est envoyé au demandeur : le seul e-mail part
vers `contact@massardevelopment.com`.

---

## 4. Inventaire du texte masqué et du texte conditionnel

Récapitulatif de tout ce qui est dans le document livré sans être
nécessairement affiché.

| Texte | Statut | Raison |
|---|---|---|
| Aller au contenu | [MASQUÉ] / [INTERACTION] | positionné à `-100px` ; descend au focus clavier |
| Les 4 textes du héro défilant | [MASQUÉ] sous 720 px, en portrait ≤1024 px, sur pointeur grossier en portrait, en paysage sur pointeur grossier ≤560 px de haut, et en mouvement réduit | `.bandes{display:none}` |
| Les 4 mêmes textes, copie `.sr` | [LECTEUR D'ÉCRAN] | masqués visuellement par `clip-path:inset(50%)` |
| Services aux pharmacies d'officine, Algérie / Plus qu'un service, un écosystème. / Les remises négociées… (héro fixe) | [MASQUÉ] au-dessus de ces seuils | `.fixe{display:none}` par défaut |
| مسار التطور (en-tête) | [MASQUÉ] sous 520 px | `.marque-sous{display:none}` |
| Rejoindre le réseau | [MASQUÉ] sous 520 px | `.long{display:none}` |
| Adhérer | [MASQUÉ] au-dessus de 520 px | `.court{display:none}` |
| Pôles / Adhésion / Contact | [MASQUÉ] sous 900 px | `.nav{display:none}`, sans menu de remplacement |
| Connexion | [MASQUÉ] toujours | attribut HTML `hidden` |
| Les 8 réponses de la FAQ | [INTERACTION] | `<details>` fermés ; clic sur la question |
| Ce champ est nécessaire. (×4) | [MASQUÉ] / [INTERACTION] | affiché à la soumission si le champ est vide |
| Indiquez une adresse e-mail valable. | [MASQUÉ] / [INTERACTION] | idem, champ e-mail |
| Ne pas remplir | [MASQUÉ] toujours | champ piège, `clip-path` + `aria-hidden="true"` |
| Votre demande est enregistrée. Nous vous rappelons sous 48 heures. | [MASQUÉ] / [INTERACTION] | après réponse `{"ok":true}` de `envoi.php` |
| L'envoi n'a pas abouti. Écrivez-nous directement à contact@massardevelopment.com. | [MASQUÉ] / [INTERACTION] | après échec de l'envoi |
| Nom et prénom / Nom de l'officine / … (champs du formulaire) | [MASQUÉ] / [INTERACTION] | disparaissent après un envoi réussi (`form.envoye .champs{display:none}`) |
| La trajectoire des huit pôles | visible | le texte est visible ; seule la jauge est animée |
| `+` des questions fréquentes | contenu généré CSS | `content:"+"`, absent du HTML |

---

## 5. Notes de méthode

- Les §2 et §3 sont extraits de `site/index.html` au commit `48f23ad`, seul
  fichier HTML téléversé en ligne, ainsi que de `site/envoi.php`,
  `site/robots.txt`, `site/sitemap.xml` et `site/version.txt`.
- Les quatre textes du héro ne figurent pas comme contenu dans le HTML : ils
  sont portés par des attributs `data-texte` et injectés par le script. Ils
  ont été relevés dans ces attributs, verbatim.
- Le `+` des questions fréquentes est un contenu généré par CSS ; il est
  signalé mais n'est pas du texte du document.
- Les maquettes `modeles/model-1/`, `modeles/model-2/` et `modeles/model-3/`
  ne sont pas téléversées et ne sont pas couvertes par cet export.
- Aucune vérification n'a pu être faite sur la page réellement servie par
  `massardevelopment.com` : l'accès sortant vers ce domaine est refusé par la
  politique réseau de l'environnement.
