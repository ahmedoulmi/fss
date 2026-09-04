# Mettre le simulateur en ligne — pas à pas

Cinq étapes. Aucune connaissance technique requise, mais suivez l'ordre.
Comptez vingt minutes la première fois.

Il vous faut : le fichier **`bareme-secret.json`** que vous avez reçu, et un
compte Cloudflare (gratuit, se crée en deux minutes sur `dash.cloudflare.com`).

---

## 1. Installer Node.js

Rendez-vous sur **nodejs.org** et prenez la version marquée **LTS**.

- **Windows** : le fichier `.msi`. Suivez l'assistant, tout par défaut.
- **macOS** : le fichier `.pkg`. Même chose.

C'est la seule installation nécessaire.

---

## 2. Récupérer le code

Sur la page du projet dans GitHub, ouvrez la branche
`claude/sensitive-data-file-plan-0ovrf8`, puis le bouton vert **Code** →
**Download ZIP**.

Décompressez l'archive. Vous obtenez un dossier contenant `massar-simulateur`.

---

## 3. Ouvrir un terminal dans le dossier

Placez-vous **à l'intérieur** du dossier `massar-simulateur` — celui qui
contient `deployer.js`.

- **Windows** : clic droit dans le dossier (sur une zone vide) →
  **Ouvrir dans le Terminal**. Sur les versions plus anciennes :
  Maj + clic droit → **Ouvrir la fenêtre PowerShell ici**.
- **macOS** : clic droit sur le dossier → **Services** →
  **Nouveau terminal au dossier**.

Une fenêtre noire ou blanche s'ouvre. C'est là que tout se passe.

---

## 4. Lancer

Tapez `node deployer.js ` — **avec l'espace à la fin** — puis
**faites glisser le fichier `bareme-secret.json` dans la fenêtre du
terminal**. Son chemin s'écrit tout seul. Appuyez sur Entrée.

La ligne ressemblera à :

```
node deployer.js C:\Users\VotreNom\Downloads\bareme-secret.json
```

ou, sous macOS :

```
node deployer.js /Users/votrenom/Downloads/bareme-secret.json
```

**Ce qui va se passer :**

Le script annonce chaque étape. À la troisième, votre navigateur s'ouvre pour
vous connecter à Cloudflare — autorisez, puis revenez au terminal, il continue
tout seul.

À la fin, il affiche `✓ En ligne.` et l'adresse de votre simulateur, du type
`https://massar-simulateur.votrecompte.workers.dev`.

**Si une étape échoue**, le script s'arrête et dit pourquoi. Rien n'est
publié à moitié. Corrigez, relancez la même commande : il reprend sans
recréer ce qui existe déjà.

---

## 5. Essayer avant de diffuser

Dans le même terminal, en remplaçant l'adresse par la vôtre :

```
node serveur/adaptateurs/cloudflare/creer-lien.js 3 --base https://massar-simulateur.votrecompte.workers.dev
```

Trois liens s'affichent. **Faites le parcours vous-même** avec le premier,
puis rouvrez-le : il doit annoncer « Simulation déjà effectuée ».

Tant que ce test-là ne passe pas, ne diffusez rien.

---

## Ensuite, au quotidien

Pour émettre des liens, rouvrez un terminal dans le dossier et relancez la
commande de l'étape 5, avec le nombre voulu :

```
node serveur/adaptateurs/cloudflare/creer-lien.js 10 --base https://votre-adresse
```

Chaque lien vaut **3 jours** et ne produit **qu'un seul résultat**.

## Si le barème change

Un seul geste, sans rien republier :

```
npx wrangler secret put BAREME
```

Collez le nouveau JSON, puis Entrée, puis Ctrl+D (macOS) ou Ctrl+Z puis
Entrée (Windows).

**Attention** : les liens déjà envoyés et pas encore utilisés calculeront
avec le **nouveau** barème. Émettez les liens après une révision, jamais
avant.
