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
  consomme_le TEXT
);
CREATE INDEX IF NOT EXISTS jetons_consomme_le ON jetons (consomme_le);
```

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

## Émettre des liens

**C'est le point qui demande une décision.** Émettre un lien veut dire écrire
un jeton tiré au sort dans la base. Depuis un téléphone, deux voies :

**Par la console D1**, à la main. Dans la console de la base, exécutez :

```sql
INSERT INTO jetons (jeton, officine, cree_le, expire_le, consomme_le)
VALUES (
  hex(randomblob(16)),
  '',
  datetime('now'),
  datetime('now', '+3 days'),
  NULL
);
SELECT jeton FROM jetons WHERE consomme_le IS NULL ORDER BY cree_le DESC LIMIT 1;
```

La seconde requête affiche le jeton. Le lien est alors :
`https://votre-adresse/?s=LE_JETON`

C'est laborieux, mais cela n'ajoute aucune faiblesse : rien de nouveau n'est
exposé sur internet.

**Par une page d'administration**, à construire. Plus commode, mais elle
introduit un mot de passe qui, s'il est volé, permet de fabriquer autant de
liens qu'on veut — et donc de déduire le barème en une trentaine de
simulations. C'est précisément ce que toute l'architecture empêche
aujourd'hui.

À trancher avant de la construire. Voir le README.
