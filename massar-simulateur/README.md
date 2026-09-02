# MASSAR — Simulateur de remise

Outil de simulation destiné aux pharmaciens prospects.
Spécification : `SPEC.md`. Plan d'exécution : `PLAN.md`.

## État

| Lot | Contenu | État |
|---|---|---|
| 1 | Charte, squelette des trois écrans | fait |
| 2 | Calcul, conditions d'accès, tests | fait |
| 3 | Écran résultat, document imprimé | fait |
| 4 | Mécanisme d'usage unique | **en attente de l'arbitrage A / B / C (PLAN §1)** |
| 5 | Script de génération, livrable réel | **en attente des 3 bloquants (SPEC §9)** |

Tout ce qui précède fonctionne avec le **barème d'exemple**, dont les valeurs
sont fictives. Un bandeau le rappelle à l'écran ; il disparaîtra à la génération
du livrable réel.

## Essayer

Ouvrir `src/index.html` dans un navigateur — aucune installation, aucun serveur.

## Tests

```
npm test
```

17 cas couvrant les règles de calcul (SPEC §2) et les conditions d'accès (§4) :
arrondis, ligne vide, ligne à zéro, taux moyen, seuils limites.

## Ce qui manque pour livrer

- **Barème réel** : liste des laboratoires, taux, date de validité (SPEC §9).
  À déposer dans `bareme/bareme.reel.js`, sur le modèle de `bareme.exemple.js`.
  **Ce fichier ne doit jamais être commité** — le `.gitignore` l'exclut déjà.
- **Charte Massar** : les valeurs de `src/massar_charte.js` sont provisoires
  (`provisoire: true`) et neutres. Elles sont la source unique : les remplacer
  suffit, aucune valeur n'est écrite en dur ailleurs.
- **Identité visuelle** : le logo remplace la marque typographique de l'entête.

## Points à trancher

- Option de protection A, B ou C (PLAN §1) — conditionne le lot 4.
- Textes d'accueil et message de blocage : validation (SPEC §4).
- Message de blocage : affiche-t-il une coordonnée, par exception ? (SPEC §4)
- Au-delà de 15 laboratoires, présentation de l'écran 2 (SPEC §4). Le barème
  d'exemple en compte 10 ; la question se posera avec la liste réelle.
- L'écran résultat porte une ligne « officine — date de simulation » avant la
  remise. Elle est requise par le document imprimé (SPEC §5) mais absente de
  l'ordre d'affichage du §4 : à confirmer.
