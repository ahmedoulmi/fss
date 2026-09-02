/*
 * Lancement du simulateur.
 *
 *   node serveur/lancer.js          sert la page et l'API
 *   node serveur/lancer.js 3        et émet 3 liens au passage, pour essayer
 *
 * Les liens de production s'émettent avec serveur/creer-lien.js.
 */
var { creerServeur } = require('./http.js');
var { assembler, echeance, cheminDepot } = require('./configuration.js');
var { nouveauJeton } = require('./jetons.js');

var PORT = Number(process.env.PORT) || 8787;
var contexte = assembler();

creerServeur({ noyau: contexte.noyau, racine: contexte.racineSrc })
  .listen(PORT, function () {
    if (contexte.bareme.exemple) {
      console.log('\n  ⚠  BARÈME D’EXEMPLE — valeurs fictives, ne pas diffuser');
    }
    console.log('\n  Simulateur sur http://localhost:' + PORT);
    console.log('  Dépôt des jetons : ' + cheminDepot());

    var combien = Number(process.argv[2]) || 0;
    if (combien > 0) {
      console.log('\n  Liens d’essai, à usage unique :\n');
      for (var i = 0; i < combien; i++) {
        var jeton = nouveauJeton();
        contexte.depot.creer(jeton, { expireLe: echeance() });
        console.log('    http://localhost:' + PORT + '/?s=' + jeton);
      }
    }
    console.log('');
  });
