# Mise en ligne sur Cloudflare Workers

Le simulateur tourne dans une fonction, la page est servie en fichiers
statiques, et les jetons vivent dans une base D1. Aucun serveur à administrer,
aucune mise à jour système, et le volume attendu est très loin des seuils
gratuits — 100 000 requêtes par jour, quand nous en ferons quelques dizaines
par mois.

**Le barème ne va ni dans le dépôt, ni dans la page : il est déposé comme
secret Cloudflare.**

## 1. Compte et outillage

```
npm install --save-dev wrangler
npx wrangler login
```

## 2. Base des jetons

```
npx wrangler d1 create massar-jetons
```

Reportez l'identifiant rendu dans `wrangler.toml`, à la place du
`database_id` provisoire. Puis créez la table :

```
npx wrangler d1 execute massar-jetons --remote \
  --file serveur/adaptateurs/cloudflare/schema.sql
```

## 3. Barème

En JSON, sur le modèle de `bareme/bareme.exemple.js` :

```json
{"dateValidite":"01/03/2026","laboratoires":[{"id":"lab-01","nom":"…","taux":0.025}]}
```

Taux en fraction — `0.025` vaut 2,5 %, jamais `2.5`.

```
npx wrangler secret put BAREME
```

Collez le JSON à l'invite. Il reste chez Cloudflare, chiffré, et ne
redescend jamais dans le navigateur.

## 4. Vérifier avant de publier

```
MASSAR_BAREME=/chemin/vers/votre/bareme.reel.js npm run verifier
```

Le contrôle refuse tant qu'un élément provisoire subsiste — adresse de
contact, charte — et surtout il vérifie qu'aucun taux n'apparaît dans un
fichier servi au navigateur.

## 5. Publier

```
npx wrangler deploy
```

Cloudflare rend une adresse en `.workers.dev`. Pour un domaine à vous,
ajoutez-le dans le tableau de bord Cloudflare (Workers → Custom Domains) ;
le certificat HTTPS est délivré automatiquement.

## Émettre des liens

```
node serveur/adaptateurs/cloudflare/creer-lien.js 10 \
  --base https://simulateur.massar.dz --jours 30
```

Ajoutez `--local` pour travailler sur la base locale pendant les essais.

## Essayer en local

```
npx wrangler d1 execute massar-jetons --local \
  --file serveur/adaptateurs/cloudflare/schema.sql
npx wrangler dev --local
```

Le barème local se met dans `.dev.vars` (jamais versionné) :

```
BAREME={"dateValidite":"01/01/2026","laboratoires":[…]}
```

## Ce que ce déploiement garantit

- **Le barème n'est jamais dans la page.** Elle reçoit des noms de
  laboratoires ; le calcul se fait dans la fonction.
- **Un jeton ne sert qu'une fois, même sous requêtes simultanées.** La
  consommation est une écriture SQL conditionnelle, atomique : sur huit
  requêtes lancées en même temps sur le même jeton, une seule aboutit.
  Vérifié, pas supposé.
- **Les conditions d'accès sont revalidées côté serveur.** Une page modifiée
  ne contourne pas le seuil de 5 laboratoires et de 1 000 000 DA.
- **Rien n'est collecté.** La base ne retient que le jeton, sa création, son
  échéance et sa consommation. Ni montants, ni remise.

## Mettre à jour

```
git pull
npx wrangler deploy
```

Le barème et les jetons ne sont pas touchés : ils vivent hors du code.

Une révision des taux se fait par `npx wrangler secret put BAREME` seul,
sans toucher au code. Attention à la conséquence : les liens déjà envoyés
et non encore utilisés calculeront avec le **nouveau** barème, et
afficheront sa date de validité. C'est l'inverse du problème consigné au
§10 de la spécification — plus d'exemplaires périmés en circulation — mais
cela veut dire qu'un prospect peut recevoir un lien un jour et voir un
autre chiffre le lendemain. Émettez les liens après la révision, pas
avant.
