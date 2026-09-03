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
| 4 | Lien à usage unique, calcul serveur | fait |
| 5 | Dépôt durable, émission des liens, garde-fou | fait |
| 6 | Déploiement Cloudflare Workers | fait — voir `serveur/adaptateurs/cloudflare/LISEZMOI.md` |
| 7 | Mise en service | prêt — `npm run verifier` passe |

Un déploiement sur VPS Ubuntu existe aussi (`deploiement/`), écrit avant
l'arbitrage sur l'hébergement. Il reste valable si vous changez d'avis.

## Essayer

```
npm run servir -- 3           # sert la page et émet 3 liens d'essai
```

Puis ouvrir l'un des liens affichés. Chacun ne fonctionne qu'une fois.

## Émettre des liens

```
npm run liens -- 10 --base https://simulateur.massar.dz --jours 3
npm run liens -- 1 --officine "Pharmacie du Centre"
```

Les jetons sont écrits dans `donnees/jetons.json` et survivent au redémarrage.
Sans `--jours`, un lien vaut **3 jours**.

## Avant toute mise en service

```
npm run verifier
```

Refuse la mise en ligne tant qu'un élément provisoire subsiste — barème
d'exemple, adresse de contact non renseignée, charte provisoire, taux absent ou
hors de portée — et surtout **vérifie qu'aucun taux du barème n'apparaît dans
un fichier servi au navigateur**. C'est le contrôle qui compte : tout le
dispositif repose sur cette étanchéité.

## Tests

```
npm test
```

39 cas. Les règles de calcul (SPEC §2) et les conditions d'accès (§4) :
arrondis, ligne vide, ligne à zéro, décimales coupées et non recollées, seuils
limites. Le cycle de vie du jeton : consommation unique, revalidation des
conditions côté serveur, montants réassainis, absence de taux dans tout ce qui
sort du serveur, impossibilité de la déduction par différence. Le dépôt
durable : consommation qui survit au redémarrage, expiration des liens jamais
utilisés, absence de montants et de remise dans le fichier de jetons.

## Structure

```
src/          la page — ne contient aucun taux
  massar_charte.js   source unique des couleurs et polices (SPEC §7)
  textes.js          tous les libellés affichés
  calcul.js          règles de calcul, partagées page et serveur
  ecrans.js          parcours, saisie, appels au serveur
serveur/
  noyau.js           barème, jetons, calcul — ne sort jamais d'ici
  depot-fichier.js   dépôt de jetons durable
  depot-memoire.js   dépôt de jetons pour les tests
  http.js            adaptateur HTTP — la seule couche liée à l'hébergement
  configuration.js   assemblage barème + dépôt + noyau
  creer-lien.js      émission des liens
  lancer.js          lancement du serveur
build/
  verifier.js        garde-fou avant mise en service
serveur/adaptateurs/cloudflare/
  worker.js          point d'entrée Cloudflare
  depot-d1.js        jetons dans D1, consommation atomique
  schema.sql         table des jetons
  creer-lien.js      émission des liens
  LISEZMOI.md        marche à suivre
deploiement/         variante VPS Ubuntu, conservée
bareme/
  bareme.exemple.js  valeurs fictives, versionné
  bareme.reel.js     JAMAIS versionné (.gitignore)
```

La séparation de `calcul.js` est structurante : `calculerTotaux` ne demande que
la liste des laboratoires et tourne dans la page ; `calculerRemise` demande le
barème et ne tourne que sur le serveur.

## Ce qui manque pour livrer

- **Rien côté hébergement** : Cloudflare Workers retenu, déploiement écrit.
  Le simulateur ne coûte rien à ce volume — 100 000 requêtes par jour
  gratuites, quand nous en ferons quelques dizaines par mois.
- **Barème réel** : fourni, 30 laboratoires, valable au 31/12/2026. Il vit
  dans `bareme/bareme.reel.js`, **jamais versionné**, et en secret Cloudflare
  pour la production.

Rien. `npm run verifier` passe.

## Arbitrages rendus

- Protection : **option C**, lien à usage unique et calcul serveur.
- Hébergement : **Cloudflare Workers**, base D1 pour les jetons, barème en
  secret. L'achat d'un VPS a été écarté : ce seul outil ne le justifiait pas.
- Charte : reprise de `massar_charte.js` (révision du 28 août 2026), mêmes noms
  de jetons. Vert et or ; le rouge marque sans décorer, et ne sert jamais
  d'aplat.
- Après le calcul, **le lien meurt**. Le récapitulatif n'existe plus que sur
  papier — d'où la mention « pensez à imprimer », affichée à l'écran et absente
  du document imprimé.
- Message de blocage : **pas d'invitation** « prenons rendez-vous », mais **une
  adresse e-mail**, là et sur les écrans de fin uniquement. Jamais sur l'écran
  résultat ni sur le document imprimé.
- Registre des textes : **accueillant**.
- Les cinq gammes de bandelettes restent dans le barème, sous la colonne
  « Laboratoire ».
- Le barème exprime un **gain net** : le montant affiché s'ajoute à ce que le
  pharmacien obtient déjà. L'ordre de grandeur est confirmé.
- Un lien jamais utilisé expire au bout de **3 jours**. Modifiable à l'émission
  avec `--jours`.

## Écarts assumés par rapport à la spécification

- **La phrase d'accueil est reformulée.** Celle du §4 employait un terme frappé
  d'interdit absolu par les règles permanentes de vocabulaire. Le contrôle du
  §8 de ces règles est intégré à `build/verifier.js` : le terme ne peut plus
  revenir. **La spécification elle-même n'est pas corrigée à la source** — elle
  le porte encore au §1 et au §4, et le prochain qui s'en servira le
  réintroduira.
- **L'écran résultat porte une ligne « officine — date de simulation »** avant
  la remise, requise par le document imprimé (§5) mais absente de l'ordre
  d'affichage du §4.
- **Une mention « pensez à imprimer »** figure sur l'écran résultat, absente du
  document imprimé. Conséquence du choix « le lien meurt après usage ».
- **Deux colonnes à l'écran de saisie** au-delà de 15 laboratoires, comme le §4
  le prévoyait.
- **Le taux moyen précède le montant** au lieu d'occuper une ligne discrète en
  bas. Demandé. Il n'est pas dupliqué.
- **Une adresse e-mail sur le message de blocage** et sur les écrans de fin,
  jamais sur le résultat ni à l'impression. Exception au §8, décidée.

## Points encore ouverts

- Au-delà de 15 laboratoires, présentation de l'écran 2 (SPEC §4). Le barème
  d'exemple en compte 10 ; la question se posera avec la liste réelle.
- L'écran résultat porte une ligne « officine — date de simulation » avant la
  remise. Requise par le document imprimé (SPEC §5), absente de l'ordre
  d'affichage du §4 : à confirmer.
Aucun.
- **Ordre de grandeur à confirmer** : 12 000 000 DA d'achats affichent
  3 123 000 DA de remise, taux moyen 26 %. La question porte sur ce que le
  barème représente — un gain net par rapport aux conditions actuelles du
  pharmacien, ou le taux total dont une partie lui est déjà acquise.
