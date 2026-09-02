# MASSAR DEVELOPMENT
# Simulateur de remise — Spécification fonctionnelle

Version 1 · À compléter avec le barème avant mise en service

---

## 1. Objet

Outil de simulation destiné aux pharmaciens d'officine non adhérents. Le pharmacien saisit ses achats annuels estimés par laboratoire ; l'outil affiche le montant de remise qu'il pourrait percevoir dans le cadre du groupement.

Finalité : convaincre. L'outil n'est ni un engagement, ni un instrument de suivi, ni un dispositif de collecte.

**Destinataire** : pharmacien prospect.
**Usage** : fichier autonome, transmis individuellement, utilisable sans installation.
**Version unique** — pas de mode interne distinct.

---

## 2. Principe de calcul

Chaque laboratoire porte un **taux de remise fixe**, identique quel que soit le montant. Il n'existe aucun palier, aucun seuil, aucune progressivité.

```
Remise d'un laboratoire = Montant saisi × Taux du laboratoire
Remise totale           = Somme des remises par laboratoire
Total des commandes     = Somme des montants saisis
Taux moyen              = Remise totale / Total des commandes
```

**Règles de restitution**
- Montants saisis : dinars entiers, valeurs positives, sans décimale
- Remise affichée : arrondie au dinar
- Taux moyen : une décimale
- Une ligne laissée vide n'est pas comptée

---

## 3. Barème

Table à alimenter. **Aucune valeur n'est fournie à ce stade — ne rien inventer, ne rien estimer.**

| Laboratoire | Taux de remise |
|---|---|
| *à fournir* | *à fournir* |

**Date de validité du barème** : *à fournir*

Le barème constitue la liste fermée des laboratoires proposés à la saisie. Le pharmacien ne peut pas ajouter de laboratoire hors liste. Il n'existe pas de ligne « Autres laboratoires ».

---

## 4. Parcours

Trois écrans successifs.

### Écran 1 — Accueil

Contenu :
- Identité visuelle Massar
- Deux phrases de présentation, pas davantage
- Champ **nom de l'officine**, facultatif
- Consigne de saisie affichée
- Bouton d'accès à la saisie

**Textes proposés, à valider :**
> Massar est un groupement d'achat et de services pour pharmacies d'officine.
> Estimez le montant de remise que vous pourriez percevoir sur vos achats annuels.

> Indiquez vos achats annuels par laboratoire, en dinars, hors taxes.

### Écran 2 — Saisie

- Tous les laboratoires du barème affichés d'emblée, un champ de montant par ligne
- Le pharmacien remplit uniquement les laboratoires qui le concernent
- **Total des commandes saisies visible et actualisé en continu**
- **Aucun montant de remise, aucun taux affiché à ce stade**
- Bouton de validation vers le résultat

À revoir si le barème dépasse une quinzaine de laboratoires : l'affichage intégral deviendrait illisible.

### Condition d'accès au résultat

Les deux conditions sont cumulatives :
- **5 laboratoires minimum** renseignés
- **Total des commandes ≥ 1 000 000 DA**

Tant qu'elles ne sont pas remplies, le résultat reste inaccessible et un message explicite indique ce qui manque.

**Texte proposé, à valider :**
> La simulation nécessite au moins 5 laboratoires renseignés et un total d'achats d'au moins 1 000 000 DA. Pour une estimation adaptée à votre situation, prenons rendez-vous.

*Point ouvert : aucune coordonnée n'est affichée, conformément à la décision prise sur l'écran résultat. À confirmer si le message de blocage doit faire exception.*

### Écran 3 — Résultat

Ordre d'affichage strict :

1. **Montant total de la remise estimée** — en tête, dominant, seul
2. **Total des commandes**
3. **Récapitulatif par laboratoire** — nom et montant saisi uniquement, **sans remise ni taux par ligne**
4. **Taux moyen** — discret, en bas
5. **Mentions** (§ 6)
6. **Action unique : impression du récapitulatif**

Périodicité annuelle exclusivement. Aucun équivalent mensuel.

Aucune autre action, aucun contact affiché, aucun formulaire. La relance se fait hors de l'outil.

---

## 5. Document imprimé

Reprend l'écran résultat, dans le même ordre :

- Identité visuelle Massar
- Nom de l'officine si renseigné, et date de la simulation
- Montant total de la remise estimée
- Total des commandes
- Détail par laboratoire — **montants saisis seuls, sans remise ni taux par ligne**
- Taux moyen
- Mentions

---

## 6. Mentions obligatoires

Présentes à l'écran résultat et sur le document imprimé :

> Simulation fondée sur les montants que vous saisissez.

> Conditions au [date de validité du barème].

---

## 7. Cadre

- **Langue** : français uniquement
- **Support** : conçu pour ordinateur, lisible et utilisable sur téléphone
- **Charte** : couleurs, polices et échelle typographique lues dans `massar_charte.js`, source unique. Aucune valeur en dur.

---

## 8. Exclusions explicites

Écartés en arbitrage, à ne pas réintroduire :

paliers et seuils de remise · comparaison entre barème actuel et barème Massar · champ « taux de remise actuel » · affichage de la cotisation ou du gain net · scénario prudent ou fourchette · ligne « Autres laboratoires » · champ commentaire libre · mode interne · coordonnées ou formulaire en fin de parcours · code d'accès nominatif · remise et taux par laboratoire, à l'écran comme sur le document imprimé

---

## 9. Bloquant avant mise en service

| Élément | État |
|---|---|
| Liste des laboratoires | à fournir |
| Taux par laboratoire | à fournir |
| Date de validité du barème | à fournir |

La spécification est complète. Le simulateur ne produira aucun calcul sans ces trois éléments.

---

## 10. Réserves consignées

**Le barème n'est pas protégé.** Il est lisible dans le fichier transmis, et déductible par différence entre deux simulations ne variant que d'une ligne. Le masquage de la remise par laboratoire est un choix de présentation, pas une mesure de confidentialité. Arbitré en connaissance de cause.

**Le barème est figé à la génération.** Toute révision des taux impose de régénérer et de rediffuser le fichier. Les exemplaires antérieurs restent en circulation et continuent de calculer avec les anciens taux. La date de validité affichée est la seule atténuation.

**Deux objections ne sont pas traitées par l'outil** et se jouent en rendez-vous : « j'ai déjà des remises sur ces produits », et l'absence de relance après simulation.
