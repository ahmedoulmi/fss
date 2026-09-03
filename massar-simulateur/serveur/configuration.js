/*
 * Assemblage commun au serveur et aux outils en ligne de commande :
 * quel barème, quel dépôt, quel noyau.
 */
var fs = require('node:fs');
var path = require('node:path');

var { creerNoyau } = require('./noyau.js');
var creerDepotFichier = require('./depot-fichier.js');

var RACINE = path.resolve(__dirname, '..');

/* Validité par défaut d'un lien jamais utilisé. Trois jours : le lien
   s'adresse à un prospect qu'on vient d'appeler, pas à une liste d'envoi. */
var JOURS_DE_VALIDITE = 3;

function cheminDepot() {
  return process.env.MASSAR_JETONS || path.join(RACINE, 'donnees', 'jetons.json');
}

/*
 * Le barème réel prime s'il est présent. Il n'est jamais versionné : sur une
 * machine de développement, seul l'exemple existe.
 *
 * MASSAR_BAREME permet de le tenir hors du dossier de l'application — en
 * production il vit dans /etc, lisible par le seul compte de service, et une
 * mise à jour du code ne peut ni l'écraser ni l'exposer.
 */
function chargerBareme() {
  var designe = process.env.MASSAR_BAREME;
  if (designe) {
    if (!fs.existsSync(designe)) {
      throw new Error('Barème introuvable : ' + designe);
    }
    return require(path.resolve(designe));
  }
  var reel = path.join(RACINE, 'bareme', 'bareme.reel.js');
  return fs.existsSync(reel)
    ? require(reel)
    : require(path.join(RACINE, 'bareme', 'bareme.exemple.js'));
}

function assembler() {
  var bareme = chargerBareme();
  var depot = creerDepotFichier(cheminDepot());
  return {
    bareme: bareme,
    depot: depot,
    noyau: creerNoyau({ bareme: bareme, depot: depot }),
    racineSrc: path.join(RACINE, 'src')
  };
}

function echeance(jours) {
  var date = new Date();
  date.setDate(date.getDate() + (jours || JOURS_DE_VALIDITE));
  return date.toISOString();
}

module.exports = {
  RACINE: RACINE,
  JOURS_DE_VALIDITE: JOURS_DE_VALIDITE,
  cheminDepot: cheminDepot,
  chargerBareme: chargerBareme,
  assembler: assembler,
  echeance: echeance
};
