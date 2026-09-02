/*
 * Garde-fou avant mise en service.
 *
 *   node build/verifier.js
 *
 * Refuse la mise en ligne tant qu'un élément provisoire subsiste, et vérifie
 * surtout qu'aucun taux du barème réel n'a atterri dans un fichier servi au
 * navigateur. C'est le contrôle qui compte : tout le dispositif repose sur
 * cette étanchéité.
 */
var fs = require('node:fs');
var path = require('node:path');

var { RACINE, chargerBareme } = require('../serveur/configuration.js');
var textes = require('../src/textes.js');
var { MASSAR_CHARTE } = require('../src/massar_charte.js');

var manques = [];
var bareme = chargerBareme();

/* 1. Le barème (SPEC §9) */
if (bareme.exemple) {
  manques.push('Le barème est celui d’exemple. Déposer bareme/bareme.reel.js.');
}
if (!Array.isArray(bareme.laboratoires) || bareme.laboratoires.length === 0) {
  manques.push('Le barème ne contient aucun laboratoire.');
} else {
  bareme.laboratoires.forEach(function (labo, rang) {
    var ou = 'laboratoire n°' + (rang + 1);
    if (!labo.id || !labo.nom) manques.push(ou + ' : identifiant ou nom manquant.');
    if (typeof labo.taux !== 'number' || !(labo.taux > 0) || labo.taux >= 1) {
      manques.push(ou + ' (' + (labo.nom || labo.id) +
        ') : taux absent ou hors de portée. Attendu une fraction, 0,025 pour 2,5 %.');
    }
  });
  if (bareme.laboratoires.length < 5) {
    manques.push('Le barème compte moins de 5 laboratoires : la condition ' +
      'd’accès au résultat (SPEC §4) ne pourrait jamais être remplie.');
  }
}
if (!bareme.dateValidite) {
  manques.push('La date de validité du barème est absente (SPEC §6 et §9).');
}

/* 2. Les valeurs provisoires */
if (textes.courriel.indexOf('[') !== -1) {
  manques.push('L’adresse de contact vaut encore « ' + textes.courriel +
    ' » dans src/textes.js.');
}
if (MASSAR_CHARTE.provisoire) {
  manques.push('La charte est marquée provisoire dans src/massar_charte.js.');
}

/* 3. L’étanchéité du barème — le contrôle central */
var servis = fs.readdirSync(path.join(RACINE, 'src'))
  .filter(function (nom) { return /\.(html|css|js)$/.test(nom); });

servis.forEach(function (nom) {
  var contenu = fs.readFileSync(path.join(RACINE, 'src', nom), 'utf8');
  (bareme.laboratoires || []).forEach(function (labo) {
    if (typeof labo.taux === 'number' && contenu.indexOf(String(labo.taux)) !== -1) {
      manques.push('FUITE : le taux de « ' + labo.nom + ' » apparaît dans src/' + nom + '.');
    }
  });
});

/* Verdict */
if (manques.length === 0) {
  console.log('\n  ✓ Rien ne s’oppose à la mise en service.');
  console.log('    ' + servis.length + ' fichiers servis vérifiés, aucun taux n’y figure.\n');
  process.exit(0);
}

console.log('\n  ✗ Mise en service impossible — ' + manques.length + ' point' +
  (manques.length > 1 ? 's' : '') + ' :\n');
manques.forEach(function (manque) { console.log('    · ' + manque); });
console.log('');
process.exit(1);
