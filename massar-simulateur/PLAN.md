# MASSAR — Simulateur de remise
# Plan d'exécution

Document de cadrage technique, à valider avant tout développement.
Référence fonctionnelle : `SPEC.md` (v1).

---

## 0. Le point à arbitrer avant tout le reste

La spécification (§1) décrit un **fichier autonome, transmis individuellement,
utilisable sans installation**. Le §10 acte que **le barème n'est pas protégé** :
lisible dans le fichier, déductible par différence entre deux simulations.

La demande d'un **usage unique pour ne pas divulguer les données sensibles** est
incompatible avec ce choix. Un fichier posé sur le poste du prospect ne peut pas
s'auto-limiter :

| Contournement | Effort | Résultat |
|---|---|---|
| Ouvrir le code source (Ctrl+U / F12) | 5 secondes | Barème intégral en clair |
| Recopier le fichier avant usage | 5 secondes | Nombre d'usages illimité |
| Rouvrir dans un autre navigateur / navigation privée | 10 secondes | Compteur remis à zéro |
| Vider le stockage du site | 15 secondes | Compteur remis à zéro |
| Relancer N simulations en ne variant qu'une ligne | N minutes | Tous les taux déduits un par un |

Tout mécanisme « une seule ouverture » codé dans le fichier lui-même est un
ralentisseur, pas une protection. **Le dire est plus utile que le coder en
laissant croire l'inverse.**

La seule façon de rendre l'usage unique réel est que **le barème ne soit jamais
dans le fichier remis** : le calcul se fait ailleurs, et le droit de calculer est
consommé une fois.

---

## 1. Trois options, honnêtement décrites

### Option A — Fichier autonome, usage unique cosmétique
Un seul fichier `.html`. Barème dans le code. Un marqueur de premier usage
bloque la seconde ouverture *sur le même navigateur*.

- Protège de : rien. Décourage le réemploi distrait.
- Ne protège pas de : lecture du source, copie, autre navigateur, déduction par différence.
- Fragilité technique : ouvert en `file://`, le stockage local est instable
  (bloqué sous Safari, partagé entre tous les fichiers locaux sous Chrome). Le
  blocage peut donc se déclencher à tort, ou jamais.
- Conforme à la spec §1. Contredit votre demande de confidentialité.
- Coût : ~1 jour.

### Option B — Fichier autonome chiffré + code d'accès
Barème chiffré (AES-GCM, WebCrypto) dans le fichier. Le pharmacien reçoit un
code par un autre canal, qui déverrouille le calcul.

- Protège de : le fichier transféré à un tiers sans le code, la lecture passive du source.
- Ne protège pas de : le destinataire légitime, qui peut extraire le barème
  déchiffré, et relancer autant de simulations qu'il veut.
- **Contredit une exclusion arbitrée** (§8 : « code d'accès nominatif » écarté).
- Usage unique toujours non exécutoire hors ligne.
- Coût : ~2 à 3 jours.

### Option C — Lien à usage unique, calcul distant *(recommandé)*
Le prospect ne reçoit pas un fichier mais **un lien nominatif**. La page ne
contient **que la liste des laboratoires** — aucun taux. À la validation, les
montants partent au serveur, qui renvoie uniquement : remise totale, total des
commandes, taux moyen. Le jeton est consommé au premier résultat.

- Protège de : lecture du barème (il n'y est pas), réemploi, transfert du lien,
  et **déduction par différence** — une seule simulation est possible, la
  comparaison n'existe plus.
- Bénéfice non demandé mais réel : révision des taux immédiate, sans
  régénération ni rediffusion (§10, réserve n°2 levée).
- Ne protège pas de : ce que le prospect voit légitimement, c'est-à-dire un
  montant global. C'est précisément ce que la spec veut lui montrer.
- Écart à la spec §1 : « fichier autonome » devient « lien » ; « sans
  installation » reste vrai, et l'est même davantage (rien à télécharger,
  fonctionne sur téléphone sans manipulation).
- Contrainte : hébergement + connexion internet au moment de la simulation.
- Coût : ~3 à 4 jours.

**Recommandation : option C.** C'est la seule qui rend la phrase « usage unique »
vraie. Si l'absence de réseau est rédhibitoire, alors option A **assumée comme
telle**, sans promesse de confidentialité.

---

## 2. Ce qui est commun aux trois options

Le cœur fonctionnel ne change pas. Il est développé une fois.

### 2.1 Arborescence

```
massar-simulateur/
├── SPEC.md                  spécification fonctionnelle (référence)
├── PLAN.md                  ce document
├── src/
│   ├── index.html           structure des trois écrans
│   ├── massar_charte.js     source unique de la charte (§7)
│   ├── styles.css           généré depuis la charte, aucune valeur en dur
│   ├── calcul.js            règles de calcul pures, testables
│   ├── ecrans.js            navigation, saisie, conditions d'accès
│   └── impression.css       feuille @media print
├── bareme/
│   ├── bareme.exemple.js    laboratoires fictifs, taux fictifs — versionné
│   └── bareme.reel.js       ← JAMAIS versionné (.gitignore)
├── build/
│   └── generer.mjs          injecte le barème réel et produit le livrable
└── tests/
    └── calcul.test.mjs      jeux d'essai des règles §2
```

### 2.2 Règle absolue de confidentialité

- `bareme.reel.js` et tout livrable généré sont dans `.gitignore`.
- **Rien de ce qui porte un taux réel n'entre dans git.** Un commit annulé reste
  dans l'historique ; une fuite de barème est définitive.
- Le dépôt ne contient que le barème d'exemple, ouvertement faux.
- La génération du livrable se fait en local, à partir d'un fichier de barème
  fourni séparément.

### 2.3 Modèle du barème

```js
export const BAREME = {
  dateValidite: "JJ/MM/AAAA",
  laboratoires: [
    { id: "lab-01", nom: "…", taux: 0.000 },  // taux en fraction, pas en %
  ]
};
```

Liste fermée (§3) : ordre d'affichage = ordre du tableau. Aucun ajout possible
côté pharmacien, aucune ligne « Autres laboratoires ».

### 2.4 Règles de calcul — décisions à figer

La spec pose les formules ; voici les points qu'elle laisse implicites et que je
tranche ainsi, sauf avis contraire :

| Point | Décision |
|---|---|
| Arrondi | Calcul en valeur exacte, arrondi **au seul affichage** (jamais d'arrondi intermédiaire) |
| Taux moyen | `remise exacte / total commandes × 100`, une décimale (§2) |
| Ligne « renseignée » | montant **strictement supérieur à 0** ; un `0` saisi ne compte pas dans le minimum de 5 |
| Saisie | entiers positifs uniquement, décimales et signes refusés à la frappe (§2) |
| Plafond par ligne | 1 000 000 000 DA, garde-fou silencieux contre la faute de frappe |
| Format affiché | séparateur de milliers par espace insécable, suffixe `DA` |
| Total commandes | somme exacte, entière par construction |

### 2.5 Écrans

**Écran 1 — Accueil.** Identité Massar, les deux phrases de la spec, champ
*nom de l'officine* facultatif, consigne, bouton.

**Écran 2 — Saisie.** Toutes les lignes du barème, un champ par laboratoire.
Total des commandes actualisé à chaque frappe. **Aucune remise, aucun taux.**

*Réserve technique (§4)* : au-delà d'une quinzaine de laboratoires, l'affichage
intégral devient illisible. Je ne traite pas ce cas tant que la liste n'est pas
connue — il conditionne la maquette de l'écran 2.

**Condition d'accès.** ≥ 5 laboratoires renseignés **et** total ≥ 1 000 000 DA.
Message explicite indiquant *ce qui manque précisément* (« il manque 2
laboratoires », « il manque 300 000 DA ») plutôt qu'un rappel générique.
*Point ouvert §4* : le message de blocage affiche-t-il une coordonnée, par
exception à la décision « aucun contact » ? Réponse attendue.

**Écran 3 — Résultat.** Ordre strict de la spec : remise totale dominante et
seule, total des commandes, récapitulatif par laboratoire (**nom + montant
saisi uniquement**), taux moyen discret, mentions, bouton d'impression. Aucune
autre action.

### 2.6 Charte

`massar_charte.js` est la source unique (§7). Il expose couleurs, familles et
échelle typographique ; le CSS les consomme via variables. **Aucune valeur en
dur, nulle part.** Ce fichier m'est nécessaire — à défaut, je le crée avec des
valeurs neutres explicitement provisoires, à remplacer.

### 2.7 Impression

Feuille `@media print` reprenant l'écran résultat dans le même ordre (§5) :
identité, nom de l'officine si renseigné, date de simulation, remise totale,
total, détail des montants seuls, taux moyen, mentions. Navigation, boutons et
champs masqués. Cible : une page A4.

### 2.8 Mentions (§6)

Présentes à l'écran et à l'impression, telles quelles :
> Simulation fondée sur les montants que vous saisissez.
> Conditions au [date de validité du barème].

---

## 3. Ce qui s'ajoute selon l'option retenue

### Option A
- Marqueur de premier usage en stockage local, avec **repli explicite** : si le
  stockage est indisponible, l'outil fonctionne normalement plutôt que de
  bloquer un prospect à tort.
- Écran de refus sobre au second accès.
- Mention interne, hors document remis, rappelant que le dispositif est
  dissuasif et non protecteur.

### Option B
- Barème chiffré AES-GCM, clé dérivée du code par PBKDF2 (itérations élevées).
- Écran de saisie du code en amont de l'écran 1.
- Génération d'un code par prospect, journalisée hors dépôt.
- **Nécessite de lever l'exclusion §8** sur le code d'accès nominatif.

### Option C
- Page statique servie par lien nominatif `…/s/<jeton>`.
- Point d'entrée serveur unique : reçoit `{ jeton, montants[] }`, renvoie
  `{ remiseTotale, totalCommandes, tauxMoyen }` — **jamais un taux unitaire**.
- Le serveur revalide les conditions d'accès : un client modifié ne les contourne pas.
- Jeton consommé au premier calcul réussi ; toute réutilisation renvoie un écran
  d'expiration. Le récapitulatif reste consultable et imprimable dans l'onglet ouvert.
- Journal minimal côté serveur : jeton, horodatage, statut. **Pas de montants
  conservés** — l'outil n'est pas un dispositif de collecte (§1).
- Hébergement à choisir (fonction serverless ou petit service Node).

---

## 4. Lots de livraison

| Lot | Contenu | Dépend de |
|---|---|---|
| 1 | Charte + squelette des trois écrans, barème d'exemple | `massar_charte.js` |
| 2 | Calcul, conditions d'accès, tests | lot 1 |
| 3 | Écran résultat + impression | lot 2 |
| 4 | Mécanisme d'usage unique selon l'option retenue | arbitrage §1 |
| 5 | Script de génération, recette, livrable réel | les 3 éléments bloquants |

Les lots 1 à 3 sont réalisables immédiatement avec le barème d'exemple.

---

## 5. Recette

- Jeux d'essai sur les règles §2 : ligne vide, ligne à 0, arrondis limites,
  taux moyen à une décimale, total exact.
- Conditions d'accès : 4 labos / 1 M DA, 5 labos / 999 999 DA, cas passant.
- Vérification qu'**aucun taux ni remise par ligne** n'apparaît à l'écran 2, à
  l'écran 3 ni à l'impression (§8).
- Impression : rendu A4, une page, mentions présentes.
- Téléphone : lisibilité et saisie (§7).
- Option C : rejet d'un jeton déjà consommé, revalidation serveur des conditions.

---

## 6. Bloquants et questions ouvertes

**Bloquants (§9) — aucun calcul possible sans eux :**
1. Liste des laboratoires
2. Taux par laboratoire
3. Date de validité du barème

**À fournir également :** `massar_charte.js`, et l'identité visuelle Massar.

**Questions ouvertes issues de la spec :**
- Validation des textes proposés (§4 : accueil, consigne, message de blocage).
- Message de blocage : affiche-t-il une coordonnée, par exception ? (§4)
- Au-delà de 15 laboratoires, quelle présentation pour l'écran 2 ? (§4)

**Question issue de la présente demande :**
- Quelle option de protection retenez-vous — A, B ou C ?

---

## 7. Arbitrages rendus

| Question | Décision |
|---|---|
| Niveau de protection | **Option C** — lien à usage unique, calcul serveur |
| Hébergement | **ouvert** — serveur Node si Massar en dispose déjà, sinon serverless. N'affecte que `serveur/http.js` et le dépôt de jetons |
| Après consommation du jeton | **Le lien meurt.** Le récapitulatif ne survit que sur papier |
| Coordonnée sur le message de blocage | **Une adresse e-mail**, et retrait de l'invitation « prenons rendez-vous » |
| Registre des textes | **Accueillant** |

Conséquences retenues : une mention « pensez à imprimer » apparaît sur l'écran
résultat, absente du document imprimé ; l'adresse e-mail figure sur le message
de blocage et sur les écrans de fin, jamais sur le résultat ni à l'impression.
