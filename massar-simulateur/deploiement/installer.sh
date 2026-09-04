#!/usr/bin/env bash
#
# Installation du simulateur de remise Massar sur un VPS Ubuntu.
# À lancer en root, depuis le dossier du dépôt cloné.
#
#   sudo bash deploiement/installer.sh simulateur.massar.dz
#
# Ce script n'installe PAS le barème : il est déposé à part, à la main.
# Voir deploiement/LISEZMOI.md.

set -euo pipefail

DOMAINE="${1:-}"
if [ -z "$DOMAINE" ]; then
  echo "Usage : sudo bash deploiement/installer.sh <domaine>" >&2
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "À lancer en root (sudo)." >&2
  exit 1
fi

SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CIBLE=/opt/massar-simulateur

echo "→ Paquets système"
apt-get update -qq
apt-get install -y -qq curl ca-certificates rsync nginx

echo "→ Node.js"
VERSION_NODE="$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')"
if [ -z "$VERSION_NODE" ] || [ "$VERSION_NODE" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

echo "→ Compte de service"
id massar >/dev/null 2>&1 || useradd --system --home /var/lib/massar --shell /usr/sbin/nologin massar

echo "→ Dossiers"
mkdir -p "$CIBLE" /var/lib/massar /etc/massar
# Le code appartient à root : le service tourne sans pouvoir se modifier.
rsync -a --delete \
  --exclude '.git' --exclude 'node_modules' --exclude 'donnees' \
  --exclude 'bareme/bareme.reel.js' \
  "$SOURCE"/ "$CIBLE"/
chown -R root:root "$CIBLE"
chown massar:massar /var/lib/massar
chmod 750 /var/lib/massar
# Le barème est lisible par le seul compte de service.
chown root:massar /etc/massar
chmod 750 /etc/massar

echo "→ Service"
install -m 644 "$CIBLE/deploiement/massar-simulateur.service" \
  /etc/systemd/system/massar-simulateur.service
systemctl daemon-reload
systemctl enable massar-simulateur

echo "→ nginx"
sed "s/simulateur\.massar\.dz/$DOMAINE/g" \
  "$CIBLE/deploiement/nginx-simulateur.conf" \
  > /etc/nginx/sites-available/massar-simulateur
ln -sf /etc/nginx/sites-available/massar-simulateur \
  /etc/nginx/sites-enabled/massar-simulateur
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo
echo "Installé. Il reste trois choses, dans cet ordre :"
echo
echo "  1. Déposer le barème réel dans /etc/massar/bareme.reel.js"
echo "     puis :  chown root:massar /etc/massar/bareme.reel.js"
echo "             chmod 640 /etc/massar/bareme.reel.js"
echo
echo "  2. Renseigner l'adresse de contact et la charte, puis vérifier :"
echo "     cd $CIBLE && MASSAR_BAREME=/etc/massar/bareme.reel.js node build/verifier.js"
echo
echo "  3. Certificat HTTPS, une fois le domaine pointé sur ce serveur :"
echo "     apt-get install -y certbot python3-certbot-nginx"
echo "     certbot --nginx -d $DOMAINE"
echo
echo "  Puis :  systemctl start massar-simulateur"
echo "  Émettre des liens :"
echo "     cd $CIBLE && sudo -u massar env MASSAR_BAREME=/etc/massar/bareme.reel.js \\"
echo "       MASSAR_JETONS=/var/lib/massar/jetons.json \\"
echo "       node serveur/creer-lien.js 10 --base https://$DOMAINE"
echo
