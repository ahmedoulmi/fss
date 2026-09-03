#!/usr/bin/env bash
#
# Mise en ligne du simulateur sur Cloudflare Workers.
#
#   bash deployer.sh /chemin/vers/bareme-secret.json
#
# Le barème n'est pas dans le dépôt : son chemin est passé en argument, et il
# n'est écrit nulle part ailleurs que dans le secret Cloudflare.
#
# Le script est rejouable : relancé, il ne recrée pas ce qui existe déjà.

set -euo pipefail

BAREME="${1:-}"
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE"

echec() { echo; echo "  ✗ $1" >&2; echo; exit 1; }
etape() { echo; echo "── $1"; }

[ -n "$BAREME" ] || echec "Usage : bash deployer.sh /chemin/vers/bareme-secret.json"
[ -f "$BAREME" ] || echec "Barème introuvable : $BAREME"

node -e "
  const b = require('$(realpath "$BAREME")');
  if (!Array.isArray(b.laboratoires) || !b.laboratoires.length) throw new Error('aucun laboratoire');
  if (!b.dateValidite) throw new Error('date de validité absente');
  console.log('  ' + b.laboratoires.length + ' laboratoires, conditions au ' + b.dateValidite);
" || echec "Le fichier de barème n'est pas exploitable."

etape "1/6  Contrôle avant mise en service"
MASSAR_BAREME="$(realpath "$BAREME")" node build/verifier.js \
  || echec "Le contrôle refuse la mise en ligne. Corrigez les points ci-dessus."

etape "2/6  Outillage"
command -v npx >/dev/null || echec "npx est introuvable. Installez Node.js."
npx --yes wrangler --version

etape "3/6  Compte Cloudflare"
npx wrangler whoami >/dev/null 2>&1 || {
  echo "  Connexion requise — une page va s'ouvrir dans votre navigateur."
  npx wrangler login
}
npx wrangler whoami | head -5

etape "4/6  Base des jetons"
if grep -q '^database_id = "00000000-0000-0000-0000-000000000000"' wrangler.toml; then
  echo "  Création de la base massar-jetons…"
  SORTIE="$(npx wrangler d1 create massar-jetons 2>&1 || true)"
  echo "$SORTIE"
  ID="$(printf '%s' "$SORTIE" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)"
  [ -n "$ID" ] || echec "Identifiant de base introuvable dans la réponse. Reportez-le à la main dans wrangler.toml."
  # sed -i diffère entre GNU et BSD : on passe par un fichier temporaire.
  sed "s/^database_id = \"00000000-0000-0000-0000-000000000000\"/database_id = \"$ID\"/" \
    wrangler.toml > wrangler.toml.tmp && mv wrangler.toml.tmp wrangler.toml
  echo "  database_id reporté dans wrangler.toml : $ID"
else
  echo "  wrangler.toml porte déjà un identifiant de base — rien à créer."
fi

etape "5/6  Table et barème"
npx wrangler d1 execute massar-jetons --remote \
  --file serveur/adaptateurs/cloudflare/schema.sql
echo "  Dépôt du barème en secret…"
npx wrangler secret put BAREME < "$BAREME"

etape "6/6  Publication"
npx wrangler deploy

cat <<'FIN'

  ✓ En ligne.

  Émettre trois liens d'essai — remplacez l'adresse par celle affichée
  ci-dessus par wrangler :

    node serveur/adaptateurs/cloudflare/creer-lien.js 3 \
      --base https://massar-simulateur.VOTRECOMPTE.workers.dev

  Chaque lien vaut 3 jours et ne produit qu'un seul résultat.

FIN
