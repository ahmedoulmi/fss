# Mise en ligne sur Cloudflare Workers

Le simulateur tourne dans une fonction, la page est servie en fichiers
statiques, et les jetons vivent dans une base D1. Aucun serveur à administrer,
aucune mise à jour système, et le volume attendu est très loin des seuils
gratuits — 100 000 requêtes par jour, quand nous en ferons quelques dizaines
par mois.

**Le barème ne va ni dans le dépôt, ni dans la page : il est déposé comme
secret Cloudflare.**

## En une commande

```
bash deployer.sh /chemin/vers/bareme-secret.json
```

Le script enchaîne les six étapes et s'arrête à la première qui échoue :

1. **Contrôle avant mise en service** — refuse de continuer si un taux, un nom
   de laboratoire ou un terme proscrit s'est glissé dans une page servie.
2. **Outillage** — vérifie wrangler.
3. **Compte Cloudflare** — ouvre la connexion dans le navigateur si besoin.
4. **Base des jetons** — la crée et reporte son identifiant dans
   `wrangler.toml`. C'est l'étape la plus facile à rater à la main.
5. **Table et barème** — applique le schéma, dépose le barème en secret.
6. **Publication.**

Il est rejouable : relancé, il ne recrée pas ce qui existe déjà. Le barème
n'est jamais écrit dans le dépôt — son chemin est passé en argument, et il
n'atterrit que dans le secret Cloudflare.

Cloudflare rend une adresse en `.workers.dev`, immédiatement utilisable.

## Plus tard, un domaine Massar

Un domaine personnalisé exige que la zone DNS soit **chez Cloudflare**. Celle
de `massardevelopment.com` est aujourd'hui chez Hostinger, avec le site et la
messagerie : la bascule fera passer le courrier avec elle. À faire une fois
l'outil éprouvé, en relevant la zone au préalable.

Le jour venu : passer `workers_dev` à false dans `wrangler.toml`, ajouter le
domaine dans Cloudflare (Workers → Custom Domains), redéployer. Rien d'autre
ne change dans le code.

## À la main, si le script échoue

```
npx wrangler login
npx wrangler d1 create massar-jetons          # reporter l'id dans wrangler.toml
npx wrangler d1 execute massar-jetons --remote \
  --file serveur/adaptateurs/cloudflare/schema.sql
npx wrangler secret put BAREME < bareme-secret.json
npx wrangler deploy
```

## Émettre des liens

```
node serveur/adaptateurs/cloudflare/creer-lien.js 10 \
  --base https://simulateur.massar.dz --jours 3
```

Sans `--jours`, un lien vaut **3 jours**.

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
