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

Finalité : convaincre. L'outil n'est pas un engagement.

**Il est en revanche un dispositif de collecte, depuis la révision demandée.**
Chaque simulation est enregistrée : nom de l'officine, téléphone, montants
saisis par laboratoire, total, nombre de laboratoires, remise calculée et taux
moyen. La révision est assumée et sa portée mérite d'être vue en face.

- Le pharmacien en est **informé avant de saisir**, sur l'écran d'accueil, et
  non après coup. Nom et téléphone sont **obligatoires** : un téléphone
  auquel il faut répondre décourage la saisie fantaisiste bien mieux qu'un
  contrôle de forme.
- La base ainsi constituée contient les **achats réels d'officines nommées**.
  C'est leur secret commercial. Elle relève de la loi 18-07 sur la protection
  des données à caractère personnel : finalité, information des personnes,
  durée de conservation.
- Rapportés aux montants saisis sur assez de simulations, les montants de
  remise enregistrés **permettent de retrouver le barème**. Cette base est donc
  à protéger au même titre que le secret `BAREME` — la clé d'administration
  qui l'ouvre plus encore.

*Écart assumé avec la version 1.2, demandé : elle excluait toute collecte.*

**Destinataire** : pharmacien prospect.
**Usage** : lien nominatif à usage unique, transmis individuellement,
utilisable sans installation. Les liens s'émettent et se suivent depuis une
page réservée à Massar (§ 12).
**Version unique** — pas de mode interne distinct.

---

## 2. Principe de calcul

Chaque laboratoire porte un **taux de remise fixe**, identique quel que soit le
montant. Il n'existe aucun palier, aucun seuil, aucune progressivité.

```
Remise d'un laboratoire = Montant saisi × Taux du laboratoire
Remise totale           = Somme des remises par laboratoire
Total des commandes     = Somme des montants saisis
Taux moyen              = Remise affichée / Total des commandes
```

**Règles de restitution**
- Montants saisis : dinars entiers, valeurs positives, sans décimale
- Remise affichée : arrondie au dinar, **sans arrondi intermédiaire**
- Taux moyen : une décimale
- Une ligne laissée vide n'est pas comptée ; une ligne à zéro non plus

**Précisions apportées à l'implémentation :**
- Le taux moyen se calcule sur la remise **arrondie**, celle qui est affichée,
  et non sur la valeur exacte : c'est la division que le pharmacien peut refaire
  avec les deux nombres qu'il a sous les yeux. Sur la valeur exacte, quatre
  simulations sur deux cent mille affichaient un dernier chiffre différent de
  cette division.
- Une ligne est « renseignée » si son montant est **strictement supérieur à 0**
- Les décimales saisies sont coupées, jamais recollées : « 800000,99 » vaut
  800 000 DA
- Un montant négatif ou décimal transmis au serveur est écarté, jamais
  réinterprété
- Plafond par laboratoire : **50 000 000 DA**, garde-fou contre la faute de
  frappe. Il ne s'applique pas au total, qui est une somme et peut
  légitimement le dépasser

---

## 3. Barème

**Fourni.** 30 laboratoires. **Date de validité : 31/12/2026.**

Les valeurs ne figurent pas dans ce document et n'y figureront jamais : il est
versionné. Le barème vit dans `bareme/bareme.reel.js`, exclu du dépôt, et en
secret chez l'hébergeur pour la production.

Le barème constitue la liste fermée des laboratoires proposés à la saisie. Le
pharmacien ne peut pas ajouter de laboratoire hors liste. Il n'existe pas de
ligne « Autres laboratoires ».

*Arbitré : cinq entrées du barème sont des gammes de bandelettes et non des
laboratoires. Elles restent telles quelles, sous la colonne « Laboratoire ».*

---

## 4. Parcours

Trois écrans successifs.

### Écran 1 — Accueil

Contenu :
- Identité visuelle Massar et signature
- Deux phrases de présentation, pas davantage
- Champ **nom de l'officine**, obligatoire — trois lettres au minimum
- Champ **téléphone**, obligatoire — numéro algérien, les préfixes `+213` et
  `00213` sont ramenés au `0` national
- Consigne de saisie affichée
- **Information sur l'enregistrement**, avant toute saisie (§ 1)
- Bouton d'accès à la saisie

Les deux champs sont contrôlés dans la page, puis **revalidés par le serveur**,
qui ne fait aucune confiance à une page pouvant avoir été modifiée. Une
identité refusée par le serveur **ne consomme pas le jeton** : le pharmacien
revient sur l'accueil et corrige.

**Textes retenus :**
> Massar Development négocie les conditions d'achat auprès des laboratoires et
> des grossistes, pour les pharmacies d'officine.
> Estimez le montant de remise que vous pourriez percevoir sur vos achats annuels.

> Vos coordonnées, les montants que vous saisirez et le résultat sont
> enregistrés par Massar Development.

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
2. **Total des commandes saisies**, puis sa **moyenne mensuelle**
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

**La remise reste annuelle exclusivement.** Aucun équivalent mensuel n'en est
donné : le chiffre affiché porte sur l'année, et le présenter au mois
laisserait entendre un versement périodique qui n'existe pas.

La moyenne mensuelle ne porte que sur les **achats saisis** — le douzième du
total, affiché sous lui, en plus discret. Elle sert au pharmacien à
reconnaître son propre rythme et à vérifier qu'il n'a pas confondu montant
annuel et montant mensuel en saisissant.

*Écart assumé avec la version 1.1, demandé : elle excluait tout équivalent
mensuel sans distinguer les achats de la remise.*

Aucune autre action, aucun contact affiché, aucun formulaire. La relance se
fait hors de l'outil.

---

## 5. Document imprimé

Reprend l'écran résultat, dans le même ordre :

- Identité visuelle Massar
- Nom de l'officine si renseigné, et date de la simulation
- Montant total de la remise estimée
- Total des commandes saisies, et sa moyenne mensuelle
- Détail par laboratoire — **montants saisis seuls, sans remise ni taux par ligne**
- Mentions

Le taux moyen figure en tête, avec le montant. Tient sur une page A4, barème
complet renseigné.

---

## 6. Mentions obligatoires

Présentes à l'écran résultat et sur le document imprimé :

> Estimation établie à partir des seuls montants que vous saisissez.

> Les remises réellement obtenues dépendent des conditions fournisseur et
> laboratoire.

> Le montant affiché ne comprend pas les unités gratuites (UG), et n'a pas été
> diminué des frais financiers applicables à certaines remises.

> Conditions au 31/12/2026.

**Texte arrêté avec Massar, mot pour mot.** Ces quatre phrases engagent
l'entreprise devant un pharmacien prospect : elles ne se retouchent pas au
passage d'une refonte, et toute modification se demande.

Elles bornent le chiffre affiché dans les deux sens. Les deux premières
disent qu'il s'agit d'une estimation à partir de montants déclarés, et non
d'un engagement sur ce qui sera obtenu. La troisième nomme ce qui n'y est
pas : les unités gratuites, qui viennent en supplément, et les frais
financiers, qui viendraient en déduction.

---

## 7. Cadre

- **Langue** : français uniquement
- **Support** : conçu pour ordinateur, lisible et utilisable sur téléphone
- **Charte** : couleurs, polices, échelle typographique et signature lues dans
  `massar_charte.js`, source unique. Aucune valeur en dur.
  Les valeurs reprennent celles de la charte Massar Development (révision du
  28 août 2026), avec les mêmes noms de jetons. La marque est **vert et or**,
  l'or au même rang que le vert. Le **rouge est d'usage fonctionnel
  uniquement** — alerte, point d'attention : jamais décoratif, jamais un fond.
  D'où le filet rouge, et non l'aplat, sur les messages d'attention.
- **Logo** : `src/logo-massar.png`, détouré du fond blanc et réduit à 32 Ko.
  Il remplace la marque typographique dès qu'il est présent.
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
| Charte — couleurs et polices | fourni |
| Fichier du logo | fourni |

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

**Ordre de grandeur confirmé.** Un profil d'officine à 12 000 000 DA d'achats
annuels affiche 3 123 000 DA de remise estimée, taux moyen 26 %. Le barème
exprime un **gain net** : ce montant s'ajoute à ce que le pharmacien obtient
déjà, il ne le recouvre pas.

Cela ne retire rien à l'objection consignée plus haut — « j'ai déjà des remises
sur ces produits » — mais elle se joue en rendez-vous, pas dans l'outil.

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

**Durée de vie d'un lien jamais utilisé : 3 jours**, réglable à l'émission.
Le lien s'adresse à un prospect qu'on vient d'appeler ; passé ce délai, il
faut en émettre un nouveau.

---

## Ce qui a changé depuis la version 1.2

**L'outil devient un dispositif de collecte** (§ 1), demandé. Chaque simulation
est enregistrée avec le détail par laboratoire et la remise calculée. Le
pharmacien en est informé sur l'écran d'accueil, avant toute saisie.

**Nom d'officine et téléphone obligatoires** (§ 4), demandés. Le nom doit
porter trois lettres au moins ; le téléphone doit être un numéro algérien
exploitable, normalisé en `0XXXXXXXX(X)`. Aucune règle ne distingue un vrai
nom d'un « azerty » — c'est le téléphone qui joue ce rôle, parce qu'il faut y
répondre. La connexion Google ou Facebook a été écartée : vérification de
domaine et revue d'application côté Google et Meta, pour un résultat que le
téléphone atteint aujourd'hui.

**Consultation des simulations** depuis la page de gestion (§ 12), sous la
même clé.

---

## Ce qui a changé depuis la version 1.1

**Mentions du § 6 réécrites**, texte arrêté mot pour mot avec Massar. Elles
disent désormais ce dont dépend la remise réelle — les conditions fournisseur
et laboratoire, qui n'appartiennent pas à Massar — et ce que le montant
affiché ne contient pas : les unités gratuites (UG), qui viennent en
supplément, et les frais financiers, qui viendraient en déduction.

**Moyenne mensuelle des achats saisis** (§ 4), demandée. La version 1.1
excluait tout équivalent mensuel sans distinguer les achats de la remise. La
distinction est désormais explicite : la remise reste annuelle exclusivement,
seuls les achats reçoivent une moyenne mensuelle.

**Plafond par laboratoire ramené de 1 000 000 000 à 50 000 000 DA** (§ 2),
demandé. Le total n'est pas plafonné : il est une somme, et trente
laboratoires au plafond le portent légitimement à 1 500 000 000 DA.


---

## 12. Administration des liens

Page réservée à Massar, à l'adresse `/admin.html?k=<clé>`. Conçue pour un
téléphone : c'est là que les liens s'émettent au quotidien.

**Ce qu'elle permet**
- Créer un lien, avec le nom de l'officine si on le souhaite
- Le copier, ou l'envoyer par le partage natif du téléphone
- Copier ou renvoyer un lien émis plus tôt et encore en attente
- Suivre l'état de chaque lien : en attente, utilisé, expiré
- Supprimer un lien, quel que soit son état
- **Consulter les simulations enregistrées** : officine, téléphone, date,
  total, nombre de laboratoires, remise — et le détail par laboratoire, replié
  par défaut

**La suppression est logique, jamais physique.** Le lien disparaît de la liste
et cesse aussitôt d'ouvrir quoi que ce soit — celui qui le détiendrait déjà ne
verra plus qu'un lien non valide, indiscernable d'un jeton jamais émis. Mais la
ligne demeure en base, et continue de peser dans le plafond quotidien ci-après.
Effacer pour de bon offrirait à qui tient la clé le moyen le plus simple de
contourner ce plafond : émettre, supprimer, recommencer.

**Ce qu'elle ne voit jamais** : un taux unitaire. Le barème ne lui est pas
servi, et le détail affiché ne porte que des montants saisis.

**Ce qu'elle voit désormais** : les simulations enregistrées (§ 1, révisé).
C'est la partie la plus sensible de l'outil — les achats réels d'officines
nommées, avec leur téléphone. Sous la même clé que le reste : une clé qui fuit
les expose toutes.

**La clé** vit dans le secret `CLE_ADMIN`. Elle voyage dans l'adresse, mise en
favori une fois. Sans elle, la page ne montre rien et le serveur ne répond pas.
La comparaison est à durée constante : une comparaison ordinaire s'arrête au
premier écart, et son temps de réponse trahirait le préfixe correct.

**Ce que la clé engage — consigné en connaissance de cause.** Elle permet de
fabriquer des liens, donc, à force d'en fabriquer et de comparer les résultats,
de déduire le barème par différence. C'est précisément ce que le lien à usage
unique empêche partout ailleurs. Un plafond de 30 émissions par 24 heures borne
les dégâts et rend l'abus visible dans la liste ; il ne l'empêche pas.

La réponse à une clé douteuse est de la changer — un geste, effet immédiat, les
liens déjà émis continuent de fonctionner. Ce n'est pas de la surveiller.

Le compromis est assumé : sans cette page, l'émission d'un lien passait par une
requête SQL, ce qui ne tient pas dans un usage quotidien depuis un téléphone.
