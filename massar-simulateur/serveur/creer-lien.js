/*
 * Émission des liens de simulation.
 *
 *   node serveur/creer-lien.js 10
 *   node serveur/creer-lien.js 1 --base https://simulateur.massar.dz --jours 30
 *   node serveur/creer-lien.js 1 --officine "Pharmacie du Centre"
 *
 * Chaque lien ne produit qu'un seul résultat. Les jetons sont écrits dans le
 * dépôt : ils survivent au redémarrage du serveur.
 */
var { assembler, echeance, JOURS_DE_VALIDITE, cheminDepot } = require('./configuration.js');
var { nouveauJeton } = require('./jetons.js');

function lireOption(nom, defaut) {
  var index = process.argv.indexOf('--' + nom);
  return index === -1 ? defaut : process.argv[index + 1];
}

var combien = Math.max(1, Number(process.argv[2]) || 1);
var base = lireOption('base', 'http://localhost:8787').replace(/\/+$/, '');
var jours = Number(lireOption('jours', JOURS_DE_VALIDITE));
var officine = lireOption('officine', '');

var contexte = assembler();

if (contexte.bareme.exemple) {
  console.log('\n  ⚠  BARÈME D’EXEMPLE — valeurs fictives, ne pas diffuser');
}

console.log('\n  ' + combien + ' lien' + (combien > 1 ? 's' : '') +
  ', valable' + (combien > 1 ? 's' : '') + ' ' + jours + ' jours, à usage unique :\n');

for (var i = 0; i < combien; i++) {
  var jeton = nouveauJeton();
  contexte.depot.creer(jeton, { officine: officine, expireLe: echeance(jours) });
  console.log('    ' + base + '/?s=' + jeton);
}

console.log('\n  Dépôt : ' + cheminDepot() + '\n');
