# MASSAR — Simulateur de remise

Outil de simulation destiné aux pharmaciens prospects.
Spécification : `SPEC.md`. Plan et options : `PLAN.md`.

## Principe retenu

Le prospect reçoit **un lien nominatif à usage unique**, pas un fichier.
La page ne contient aucun taux : elle demande la liste des laboratoires au
serveur, additionne les montants saisis pour afficher le total en continu, et
envoie la saisie **une seule fois** pour obtenir trois chiffres — remise, total,
taux moyen. Le barème ne quitte jamais le serveur, et le jeton meurt au premier
résultat.

C'est ce qui rend la déduction du barème par différence impossible : une
seconde simulation ne peut pas avoir lieu.

## État

| Lot | Contenu | État |
|---|---|---|
| 1 | Charte, trois écrans | fait |
| 2 | Calcul, conditions d'accès, tests | fait |
| 3 | Écran résultat, document imprimé | fait |
| 4 | Lien à usage unique, calcul serveur | fait, dépôt de jetons en mémoire |
| 5 | Dépôt durable, mise en ligne, barème réel | **en attente** |

## Essayer

```
node serveur/lancer.js 3      # émet 3 liens de simulation
```

Puis ouvrir l'un des liens affichés. Chacun ne fonctionne qu'une fois.

## Tests

```
npm test
```

33 cas. Les règles de calcul (SPEC §2) et les conditions d'accès (§4) :
arrondis, ligne vide, ligne à zéro, décimales coupées et non recollées, seuils
limites. Le cycle de vie du jeton : consommation unique, revalidation des
conditions côté serveur, montants réassainis, absence de taux dans tout ce qui
sort du serveur, impossibilité de la déduction par différence.

## Structure

```
src/          la page — ne contient aucun taux
  massar_charte.js   source unique des couleurs et polices (SPEC §7)
  textes.js          tous les libellés affichés
  calcul.js          règles de calcul, partagées page et serveur
  ecrans.js          parcours, saisie, appels au serveur
serveur/
  noyau.js           barème, jetons, calcul — ne sort jamais d'ici
  depot-memoire.js   dépôt de jetons (à remplacer, lot 5)
  http.js            adaptateur HTTP — la seule couche liée à l'hébergement
  lancer.js          lancement local et émission de liens
bareme/
  bareme.exemple.js  valeurs fictives, versionné
  bareme.reel.js     JAMAIS versionné (.gitignore)
```

La séparation de `calcul.js` est structurante : `calculerTotaux` ne demande que
la liste des laboratoires et tourne dans la page ; `calculerRemise` demande le
barème et ne tourne que sur le serveur.

## Ce qui manque pour livrer

- **Hébergement** (question ouverte) : serveur Node, ou fonction serverless.
  Seul `serveur/http.js` et le dépôt de jetons en dépendent ; le noyau ne bouge
  pas. Le dépôt actuel est en mémoire — les jetons disparaissent au redémarrage.
- **Barème réel** : laboratoires, taux, date de validité (SPEC §9).
  À déposer dans `bareme/bareme.reel.js`, sur le modèle de `bareme.exemple.js`.
  `lancer.js` le prend automatiquement s'il existe. **Ne jamais le commiter.**
- **Adresse de contact** : `courriel` dans `src/textes.js` vaut
  `[adresse à fournir]`. Elle apparaît sur le message de blocage et sur les
  écrans de fin.
- **Charte Massar** : les valeurs de `src/massar_charte.js` sont provisoires
  (`provisoire: true`). Les remplacer suffit — aucune valeur n'est en dur
  ailleurs.
- **Identité visuelle** : le logo remplace la marque typographique de l'entête.

## Arbitrages rendus

- Protection : **option C**, lien à usage unique et calcul serveur.
- Après le calcul, **le lien meurt**. Le récapitulatif n'existe plus que sur
  papier — d'où la mention « pensez à imprimer », affichée à l'écran et absente
  du document imprimé.
- Message de blocage : **pas d'invitation** « prenons rendez-vous », mais **une
  adresse e-mail**, là et sur les écrans de fin uniquement. Jamais sur l'écran
  résultat ni sur le document imprimé.
- Registre des textes : **accueillant**.

## Points encore ouverts

- Au-delà de 15 laboratoires, présentation de l'écran 2 (SPEC §4). Le barème
  d'exemple en compte 10 ; la question se posera avec la liste réelle.
- L'écran résultat porte une ligne « officine — date de simulation » avant la
  remise. Requise par le document imprimé (SPEC §5), absente de l'ordre
  d'affichage du §4 : à confirmer.
- Durée de vie d'un lien jamais utilisé : aucune expiration pour l'instant.
