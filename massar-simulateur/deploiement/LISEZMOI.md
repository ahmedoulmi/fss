# Mise en ligne sur un VPS Ubuntu

Trois fichiers, un script, et quatre gestes à faire à la main. Le barème n'est
jamais dans le dépôt : il est déposé séparément, sur le serveur, et le script
d'installation refuse explicitement de le copier.

## Avant de commencer

- Un VPS Ubuntu LTS, accès root en SSH.
- Un sous-domaine dont l'enregistrement **A** pointe sur l'IP du serveur.
  Sans cela, le certificat HTTPS ne peut pas être délivré.

## 1. Installer

```
git clone <dépôt> massar
cd massar/massar-simulateur
sudo bash deploiement/installer.sh simulateur.massar.dz
```

Le script installe Node, nginx, un compte de service `massar` sans shell, le
service système et la façade nginx. Le code est copié dans `/opt` et appartient
à root : **le service tourne sans pouvoir se modifier lui-même**.

## 2. Déposer le barème

```
sudo nano /etc/massar/bareme.reel.js
sudo chown root:massar /etc/massar/bareme.reel.js
sudo chmod 640 /etc/massar/bareme.reel.js
```

Sur le modèle de `bareme/bareme.exemple.js`. Il vit dans `/etc`, hors du dossier
de l'application : une mise à jour du code ne peut ni l'écraser ni l'exposer, et
seul le compte de service peut le lire.

## 3. Renseigner ce qui reste, puis vérifier

L'adresse de contact dans `src/textes.js`, la charte dans
`src/massar_charte.js`. Puis :

```
cd /opt/massar-simulateur
sudo MASSAR_BAREME=/etc/massar/bareme.reel.js node build/verifier.js
```

Tant que ce contrôle échoue, ne mettez pas en service : il vérifie notamment
qu'aucun taux ne s'est glissé dans un fichier servi au navigateur.

## 4. HTTPS, puis démarrer

```
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d simulateur.massar.dz
sudo systemctl start massar-simulateur
sudo systemctl status massar-simulateur
```

## Émettre des liens

```
cd /opt/massar-simulateur
sudo -u massar env MASSAR_BAREME=/etc/massar/bareme.reel.js \
  MASSAR_JETONS=/var/lib/massar/jetons.json \
  node serveur/creer-lien.js 10 --base https://simulateur.massar.dz
```

## Mettre à jour le code

```
cd ~/massar && git pull
cd massar-simulateur
sudo bash deploiement/installer.sh simulateur.massar.dz
sudo systemctl restart massar-simulateur
```

Le barème et les jetons émis ne sont pas touchés : ils vivent hors du dossier
de l'application.

## Ce que le déploiement protège

- **Le port Node n'est joignable que depuis la machine elle-même.** Seul nginx
  lui parle ; rien n'est exposé directement au réseau.
- **Le service ne peut écrire que le fichier de jetons.** Le reste du disque
  lui est fermé, y compris son propre code et le barème.
- **La page ne charge rien d'extérieur** — ni police, ni script, ni image
  distante — et la politique de sécurité de contenu l'impose plutôt que de s'y
  fier.
- **Les liens de simulation ne s'indexent pas** : en-tête `X-Robots-Tag` en plus
  de la balise de la page.
- **Une limite de débit sur l'API.** Un jeton fait 128 bits, le deviner est hors
  de portée ; rien n'oblige pour autant à laisser marteler la porte.

## Journaux

```
sudo journalctl -u massar-simulateur -f
```

Le service ne journalise ni montants ni remise. Le fichier de jetons ne retient
que le jeton, sa création, son échéance et sa consommation.
