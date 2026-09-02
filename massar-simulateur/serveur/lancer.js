/*
 * Lancement local : assemble le barème, le dépôt de jetons, le noyau et
 * l'adaptateur HTTP, puis émet un lien de simulation.
 *
 *   node serveur/lancer.js            un lien
 *   node serveur/lancer.js 5          cinq liens
 *
 * Le dépôt est en mémoire : les jetons disparaissent à l'arrêt du processus.
 * L'hébergement retenu déterminera le dépôt réel (question 2 en suspens).
 */
var fs = require('node:fs');
var path = require('node:path');

var { creerNoyau } = require('./noyau.js');
var { creerServeur } = require('./http.js');
var { nouveauJeton } = require('./jetons.js');
var creerDepotMemoire = require('./depot-memoire.js');

var RACINE = path.resolve(__dirname, '..');
var PORT = Number(process.env.PORT) || 8787;

var cheminReel = path.join(RACINE, 'bareme', 'bareme.reel.js');
var bareme = fs.existsSync(cheminReel)
  ? require(cheminReel)
  : require(path.join(RACINE, 'bareme', 'bareme.exemple.js'));

var depot = creerDepotMemoire();
var noyau = creerNoyau({ bareme: bareme, depot: depot });
var serveur = creerServeur({ noyau: noyau, racine: path.join(RACINE, 'src') });

serveur.listen(PORT, function () {
  var combien = Math.max(1, Number(process.argv[2]) || 1);

  if (bareme.exemple) {
    console.log('\n  ⚠  BARÈME D’EXEMPLE — valeurs fictives, ne pas diffuser\n');
  }
  console.log('  Simulateur sur http://localhost:' + PORT);
  console.log('  Lien' + (combien > 1 ? 's' : '') + ' de simulation, à usage unique :\n');

  for (var i = 0; i < combien; i++) {
    var jeton = nouveauJeton();
    depot.creer(jeton, {});
    console.log('    http://localhost:' + PORT + '/?s=' + jeton);
  }
  console.log('');
});
