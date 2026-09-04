# Mettre en ligne depuis un téléphone

Tout se fait dans le navigateur, sans terminal. Comptez une demi-heure la
première fois. Prévoyez le fichier **`bareme-secret.json`** ouvert dans une
autre application, pour pouvoir en copier le contenu.

---

## 1. Créer la base des jetons

Sur **dash.cloudflare.com**, connectez-vous.

Menu → **Storage & Databases** → **D1** → **Create database**.
Nommez-la exactement **`massar-jetons`**.

Une fois créée, la page affiche son **Database ID** — une longue suite de
caractères. **Copiez-la**, elle sert à l'étape suivante.

---

## 2. Reporter l'identifiant dans le code

Sur GitHub, ouvrez le fichier `massar-simulateur/wrangler.toml` de la branche
`claude/sensitive-data-file-plan-0ovrf8`.

Touchez l'icône **crayon** (Edit). Trouvez la ligne :

```
database_id = "00000000-0000-0000-0000-000000000000"
```

Remplacez les zéros par l'identifiant copié, en gardant les guillemets.
Puis **Commit changes**.

---

## 3. Créer la table

Retour sur Cloudflare, dans votre base **massar-jetons** → onglet **Console**.

Collez ceci, puis exécutez :

```sql
CREATE TABLE IF NOT EXISTS jetons (
  jeton       TEXT PRIMARY KEY,
  officine    TEXT NOT NULL DEFAULT '',
  cree_le     TEXT NOT NULL,
  expire_le   TEXT,
  consomme_le TEXT,
  supprime_le TEXT
);
CREATE INDEX IF NOT EXISTS jetons_consomme_le ON jetons (consomme_le);
```

### Si la base existait déjà

La colonne `supprime_le` est arrivée avec le bouton de suppression. Une base
créée avant ne l'a pas, et la page de gestion restera en erreur tant qu'elle
manque. Une seule commande à passer dans la même **Console**, une seule fois :

```sql
ALTER TABLE jetons ADD COLUMN supprime_le TEXT;
```

Si la réponse dit que la colonne existe déjà, c'est qu'elle y était : rien à
faire.

### La table des simulations

Elle est arrivée avec l'enregistrement des simulations. À créer une fois, dans
la même **Console** :

```sql
DROP TABLE IF EXISTS simulations;
CREATE TABLE IF NOT EXISTS simulations (
  jeton           TEXT PRIMARY KEY,
  nom             TEXT NOT NULL,
  prenom          TEXT NOT NULL,
  telephone       TEXT NOT NULL DEFAULT '',
  simule_le       TEXT NOT NULL,
  total           INTEGER NOT NULL,
  nb_laboratoires INTEGER NOT NULL,
  remise          INTEGER NOT NULL,
  taux_moyen      REAL    NOT NULL,
  detail          TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS simulations_simule_le ON simulations (simule_le);
```

Le `DROP` en tête efface les simulations déjà enregistrées : il est là parce
que la table a changé de forme — l'officine unique est devenue nom + prénom.
S'il y en avait que vous vouliez garder, relevez-les avant.

Sans cette table, la simulation s'affiche au pharmacien mais rien n'est
conservé, et la page de gestion le signale.

---

## 4. Publier le simulateur

Menu → **Workers & Pages** → **Create** → onglet **Import a repository**.

Autorisez Cloudflare à accéder à votre GitHub, puis choisissez :

- dépôt : **ahmedoulmi/fss**
- branche : **claude/sensitive-data-file-plan-0ovrf8**
- **Root directory** : `massar-simulateur` — ne l'oubliez pas, sans quoi
  Cloudflare ne trouvera pas `wrangler.toml`

Puis **Deploy**. La première publication échouera peut-être faute du barème :
c'est normal, l'étape suivante le règle.

---

## 5. Déposer le barème

Votre Worker → **Settings** → **Variables and Secrets** → **Add**.

- Type : **Secret** — surtout pas « Text », qui laisserait le barème lisible
- Nom : **`BAREME`**
- Valeur : le contenu **entier** de `bareme-secret.json`, d'un seul tenant

Enregistrez, puis **Deployments** → **Retry deployment**.

---

## 6. Essayer

Cloudflare affiche l'adresse de votre simulateur, du type
`https://massar-simulateur.votrecompte.workers.dev`.

Ouvrez-la : elle doit répondre **« Lien non valide »**. C'est le bon signe —
sans jeton, personne n'entre.

Pour obtenir un lien d'essai, voir la section suivante.

---

## 7. La clé de gestion des liens

Votre Worker → **Settings** → **Variables and Secrets** → **Add**.

- Type : **Secret**
- Nom : **`CLE_ADMIN`**
- Valeur : une longue suite de caractères au hasard, **au moins 30**. Le plus
  simple : ouvrez un générateur de mot de passe et demandez-en un de 40
  caractères. Ne l'inventez pas de tête.

**Copiez cette valeur avant d'enregistrer** : Cloudflare ne la réaffichera
jamais.

Puis **Deployments** → **Retry deployment**.

---

## Gérer les liens, depuis le téléphone

Ouvrez, en remplaçant les deux parties :

```
https://massar-simulateur.votrecompte.workers.dev/admin.html?k=VOTRE_CLE
```

**Mettez cette adresse en favori.** C'est votre page de gestion, et la clé y
est déjà : vous n'aurez plus rien à taper.

Elle permet de :

- **créer un lien**, avec le nom de l'officine si vous le souhaitez ;
- le **copier**, ou l'**envoyer** directement par WhatsApp ou SMS — le bouton
  d'envoi apparaît sur téléphone ;
- **consulter les simulations enregistrées** : nom et prénom déclarés,
  téléphone, date, libellé du lien, total, nombre de laboratoires et remise,
  avec le détail par laboratoire à déplier ;
- **suivre l'état** de chaque lien émis : en attente, utilisé, ou expiré ;
- **supprimer** un lien. Il quitte la liste et cesse aussitôt de fonctionner,
  même s'il a déjà été envoyé — le pharmacien qui l'ouvrirait ensuite verrait
  « Lien non valide ». C'est sans retour.

  À savoir : supprimer ne rend pas de place sous le plafond de 30 liens par
  jour. C'est voulu — sans quoi il suffirait de supprimer au fur et à mesure
  pour émettre sans limite, et le plafond ne protégerait plus rien.

Cette page ne voit jamais un taux unitaire. Elle porte en revanche les achats
réels d'officines nommées, avec leur téléphone : c'est ce que l'outil a de plus
sensible, et la clé est ce qui l'ouvre.

### Ce que la clé engage

Elle permet de fabriquer des liens. Quelqu'un qui la volerait pourrait en
fabriquer beaucoup, et **finirait par déduire votre barème** en comparant des
simulations. Un plafond de 30 liens par jour borne les dégâts et rend l'abus
visible, mais il ne l'empêche pas.

Deux règles simples :

- **Ne partagez cette adresse avec personne** en dehors de Massar.
- **Si vous avez un doute, changez la clé.** Reposez-en une nouvelle au même
  endroit dans Cloudflare ; l'ancienne cesse aussitôt de fonctionner. Les liens
  déjà émis, eux, continuent de marcher.

---

## Émettre des liens en ligne de commande

Si vous êtes devant un ordinateur, la voie reste ouverte :

```
node serveur/adaptateurs/cloudflare/creer-lien.js 10 --base https://votre-adresse
```
