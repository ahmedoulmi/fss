# MASSAR DEVELOPMENT
# Simulateur de remise — Spécification fonctionnelle

Version 1.1 · Barème fourni · Corrections de vocabulaire appliquées

> **Ce qui a changé depuis la version 1** est consigné au § 11. La correction
> la plus importante porte sur le vocabulaire : la version 1 employait, dans
> deux phrases dont une vue par chaque prospect, un terme frappé d'interdit
> absolu par les règles permanentes de Massar Development.

---

## 1. Objet

Outil de simulation destiné aux pharmaciens d'officine non adhérents. Le
pharmacien saisit ses achats annuels estimés par laboratoire ; l'outil affiche
le montant de remise qu'il pourrait percevoir dans le cadre des conditions
négociées par Massar auprès des laboratoires et des grossistes.

Finalité : convaincre. L'outil n'est ni un engagement, ni un instrument de
suivi, ni un dispositif de collecte.

**Destinataire** : pharmacien prospect.
**Usage** : lien nominatif à usage unique, transmis individuellement,
utilisable sans installation.
**Version unique** — pas de mode interne distinct.

---

## 2. Principe de calcul

Chaque laboratoire porte un **taux de remise fixe**, identique quel que soit le
montant. Il n'existe aucun palier, aucun seuil, aucune progressivité.

```
Remise d'un laboratoire = Montant saisi × Taux du laboratoire
Remise totale           = Somme des remises par laboratoire
Total des commandes     = Somme des montants saisis
Taux moyen              = Remise totale / Total des commandes
```

**Règles de restitution**
- Montants saisis : dinars entiers, valeurs positives, sans décimale
- Remise affichée : arrondie au dinar, **sans arrondi intermédiaire**
- Taux moyen : une décimale
- Une ligne laissée vide n'est pas comptée ; une ligne à zéro non plus

**Précisions apportées à l'implémentation :**
- Une ligne est « renseignée » si son montant est **strictement supérieur à 0**
- Les décimales saisies sont coupées, jamais recollées : « 800000,99 » vaut
  800 000 DA
- Un montant négatif ou décimal transmis au serveur est écarté, jamais
  réinterprété
- Plafond par ligne : 1 000 000 000 DA, garde-fou contre la faute de frappe

---

## 3. Barème

**Fourni.** 30 laboratoires. **Date de validité : 31/12/2026.**

Les valeurs ne figurent pas dans ce document et n'y figureront jamais : il est
versionné. Le barème vit dans `bareme/bareme.reel.js`, exclu du dépôt, et en
secret chez l'hébergeur pour la production.

Le barème constitue la liste fermée des laboratoires proposés à la saisie. Le
pharmacien ne peut pas ajouter de laboratoire hors liste. Il n'existe pas de
ligne « Autres laboratoires ».

*Point ouvert : cinq entrées du barème sont des gammes de bandelettes et non
des laboratoires, alors que la colonne s'intitule « Laboratoire ». Les entrées
concernées sont identifiables dans le barème lui-même ; elles ne sont pas
nommées ici, ce document étant versionné.*

---

## 4. Parcours

Trois écrans successifs.

### Écran 1 — Accueil

Contenu :
- Identité visuelle Massar et signature
- Deux phrases de présentation, pas davantage
- Champ **nom de l'officine**, facultatif
- Consigne de saisie affichée
- Bouton d'accès à la saisie

**Textes retenus :**
> Massar Development négocie les conditions d'achat auprès des laboratoires et
> des grossistes, pour les pharmacies d'officine.
> Estimez le montant de remise que vous pourriez percevoir sur vos achats annuels.

> Indiquez vos achats annuels par laboratoire, en dinars, hors taxes.
> Laissez vide les laboratoires qui ne vous concernent pas.

La signature — *Plus qu'un service, un écosystème* — est lue dans
`massar_charte.js`, jamais écrite en dur.

### Écran 2 — Saisie

- Tous les laboratoires du barème affichés d'emblée, un champ de montant par ligne
- Le pharmacien remplit uniquement les laboratoires qui le concernent
- **Total des commandes saisies visible et actualisé en continu**
- **Aucun montant de remise, aucun taux affiché à ce stade**
- Bouton de validation vers le résultat

**Le barème comptant 30 laboratoires**, l'affichage passe en **deux colonnes**
sur écran large, lues de haut en bas : 1 à 15 à gauche, 16 à 30 à droite. Rien
n'est caché ni replié. Sur téléphone, une seule colonne.

**Le total reste collé au bas de la fenêtre** pendant le défilement : c'est lui
qui indique au pharmacien s'il approche du seuil.

### Condition d'accès au résultat

Les deux conditions sont cumulatives :
- **5 laboratoires minimum** renseignés
- **Total des commandes ≥ 1 000 000 DA**

Tant qu'elles ne sont pas remplies, le résultat reste inaccessible et un
message explicite indique **ce qui manque précisément**.

Ces conditions sont **revalidées côté serveur** : une page modifiée ne les
contourne pas.

**Texte retenu :**
> Il manque [ce qui manque]. En deçà de 5 laboratoires et de 1 000 000 DA
> d'achats annuels, l'estimation ne serait pas représentative de ce que Massar
> peut vous apporter. Écrivez-nous à contact@massardevelopment.com, nous
> regarderons votre situation.

*L'invitation « prenons rendez-vous » de la version 1 est retirée : elle
appelait une action sans en donner le moyen. Une adresse est affichée ici, et
sur les écrans de fin — jamais sur l'écran résultat ni sur le document imprimé.
C'est l'exception au § 8, décidée.*

### Écran 3 — Résultat

Ordre d'affichage :

1. **Taux moyen puis montant total de la remise estimée**, sur la même ligne —
   en tête, le montant dominant
2. **Total des commandes**
3. **Récapitulatif par laboratoire** — nom et montant saisi uniquement, **sans remise ni taux par ligne**
4. **Mentions** (§ 6)
5. **Action unique : impression du récapitulatif**

*Écart assumé avec la version 1, demandé : le taux moyen y occupait une ligne
discrète en bas. Il précède désormais le montant. Il n'est pas dupliqué.*

Une ligne **« officine — date de simulation »** précède l'ensemble : elle est
requise par le document imprimé (§ 5) et assure que l'écran et le papier ont la
même structure.

Une mention **« pensez à imprimer »** figure sur l'écran, absente du document
imprimé : le lien meurt après usage, le récapitulatif ne survit que sur papier.

Périodicité annuelle exclusivement. Aucun équivalent mensuel.

Aucune autre action, aucun contact affiché, aucun formulaire. La relance se
fait hors de l'outil.

---

## 5. Document imprimé

Reprend l'écran résultat, dans le même ordre :

- Identité visuelle Massar
- Nom de l'officine si renseigné, et date de la simulation
- Montant total de la remise estimée
- Total des commandes
- Détail par laboratoire — **montants saisis seuls, sans remise ni taux par ligne**
- Mentions

Le taux moyen figure en tête, avec le montant. Tient sur une page A4, barème
complet renseigné.

---

## 6. Mentions obligatoires

Présentes à l'écran résultat et sur le document imprimé :

> Simulation fondée sur les montants que vous saisissez.

> Conditions au 31/12/2026.

---

## 7. Cadre

- **Langue** : français uniquement
- **Support** : conçu pour ordinateur, lisible et utilisable sur téléphone
- **Charte** : couleurs, polices, échelle typographique et signature lues dans
  `massar_charte.js`, source unique. Aucune valeur en dur.
  Les couleurs sont relevées sur le logo — vert profond de la calligraphie, or
  du lettrage latin. Les polices ne sont pas connues.
- **Logo** : déposer le fichier en `src/logo-massar.png` suffit ; il remplace
  alors la marque typographique, sans modification du code.
- **Vocabulaire** : les règles permanentes de Massar Development s'appliquent à
  tout libellé. Le contrôle est automatisé (§ 9).

---

## 8. Exclusions explicites

Écartés en arbitrage, à ne pas réintroduire :

paliers et seuils de remise · comparaison entre barème actuel et barème Massar ·
champ « taux de remise actuel » · affichage de la cotisation ou du gain net ·
scénario prudent ou fourchette · ligne « Autres laboratoires » · champ
commentaire libre · mode interne · formulaire en fin de parcours · code d'accès
nominatif · remise et taux par laboratoire, à l'écran comme sur le document
imprimé

**Une exception, décidée** : une adresse de contact figure sur le message de
blocage et sur les écrans de fin. Jamais sur l'écran résultat, jamais à
l'impression.

---

## 9. Avant mise en service

| Élément | État |
|---|---|
| Liste des laboratoires | fourni — 30 |
| Taux par laboratoire | fourni |
| Date de validité du barème | fourni — 31/12/2026 |
| Adresse de contact | fourni |
| Couleurs de la charte | relevées sur le logo, à confirmer |
| Polices de la charte | **manquant** |
| Fichier du logo | **manquant** — marque typographique en attendant |

Le contrôle `npm run verifier` refuse la mise en ligne tant qu'un élément
provisoire subsiste. Il vérifie aussi, et c'est l'essentiel, qu'aucun nom de
laboratoire ni aucun taux n'apparaît dans un fichier servi au navigateur, et
qu'aucun terme proscrit ne s'y est glissé.

---

## 10. Réserves — mises à jour

**Le barème est protégé.** La réserve de la version 1 ne tient plus. La page ne
reçoit que des noms de laboratoires ; le calcul se fait sur le serveur, qui ne
renvoie que trois agrégats. Le jeton est consommé au premier résultat, ce qui
rend la déduction par différence impossible : une seconde simulation n'a pas
lieu. Vérifié sous requêtes concurrentes.

**Le barème n'est plus figé à la diffusion.** Il se révise sans rien
redéployer. Conséquence à connaître : les liens déjà envoyés et non encore
utilisés calculeront avec le **nouveau** barème. Émettre les liens après une
révision, jamais avant.

**Le récapitulatif ne survit pas à la fermeture de la page.** Décidé. Le
pharmacien qui ferme sans imprimer doit demander un nouveau lien.

**Deux objections ne sont pas traitées par l'outil** et se jouent en
rendez-vous : « j'ai déjà des remises sur ces produits », et l'absence de
relance après simulation.

**Ordre de grandeur à confirmer.** Un profil d'officine à 12 000 000 DA
d'achats annuels affiche 3 123 000 DA de remise estimée, pour un taux moyen de
26 %. C'est le chiffre que verra le prospect.

---

## 11. Ce qui a changé depuis la version 1

**Vocabulaire — correction obligatoire.** Les § 1 et § 4 employaient un terme
frappé d'interdit absolu par les règles permanentes. En droit algérien il
désigne une forme juridique à responsabilité solidaire des membres sur leur
patrimoine propre ; Massar Development est une SARL. L'employer devant un
pharmacien prospect lui laisse croire qu'il engagerait son patrimoine
personnel. Les deux phrases sont reformulées d'après les tournures autorisées,
et le contrôle est automatisé.

**Fichier autonome → lien à usage unique.** La version 1 prévoyait un fichier
transmis au prospect, et consignait au § 10 que le barème y serait lisible et
déductible. Ce choix est abandonné au profit d'un lien nominatif : le barème
reste sur le serveur, le jeton meurt au premier résultat.

**Message de blocage.** L'invitation « prenons rendez-vous » est retirée, une
adresse e-mail la remplace.

**Écran 2 en deux colonnes**, le barème dépassant la quinzaine annoncée au § 4.

**Précisions de calcul** portées au § 2 : arrondi, ligne à zéro, décimales,
montants négatifs, plafond.

**Durée de vie d'un lien jamais utilisé : 60 jours**, valeur prise faute
d'instruction, réglable à l'émission. À confirmer.
