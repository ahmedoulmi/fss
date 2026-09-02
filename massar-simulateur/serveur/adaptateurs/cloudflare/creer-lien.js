/*
 * Émission des liens de simulation, version Cloudflare.
 *
 *   node serveur/adaptateurs/cloudflare/creer-lien.js 10 \
 *        --base https://simulateur.massar.dz --jours 30
 *
 *   ... --local     pour la base D1 locale, pendant les essais
 *
 * Les jetons sont tirés au sort ici puis insérés dans D1 par wrangler.
 * Aucun point d'entrée d'administration n'est exposé sur internet : c'est une
 * surface d'attaque en moins, pour une commande de plus.
 */
var crypto = require('node:crypto');
var fs = require('node:fs');
var os = require('node:os');
var path = require('node:path');
var { execFileSync } = require('node:child_process');

var JOURS_PAR_DEFAUT = 60;

function lireOption(nom, defaut) {
  var index = process.argv.indexOf('--' + nom);
  return index === -1 ? defaut : process.argv[index + 1];
}

var combien = Math.max(1, Number(process.argv[2]) || 1);
var base = lireOption('base', 'http://localhost:8787').replace(/\/+$/, '');
var jours = Number(lireOption('jours', JOURS_PAR_DEFAUT));
var officine = lireOption('officine', '');
var local = process.argv.indexOf('--local') !== -1;

var echeance = new Date();
echeance.setDate(echeance.getDate() + jours);

/* Une apostrophe dans un nom d'officine ne doit pas casser la requête. */
function citer(texte) {
  return "'" + String(texte).replace(/'/g, "''") + "'";
}

var jetons = [];
var lignes = [];

for (var i = 0; i < combien; i++) {
  var jeton = crypto.randomBytes(16).toString('base64url');
  jetons.push(jeton);
  lignes.push(
    'INSERT INTO jetons (jeton, officine, cree_le, expire_le, consomme_le) VALUES (' +
    [citer(jeton), citer(officine), citer(new Date().toISOString()),
     citer(echeance.toISOString()), 'NULL'].join(', ') + ');'
  );
}

var fichier = path.join(os.tmpdir(), 'massar-liens-' + Date.now() + '.sql');
fs.writeFileSync(fichier, lignes.join('\n') + '\n', 'utf8');

try {
  execFileSync('npx', [
    'wrangler', 'd1', 'execute', 'massar-jetons',
    local ? '--local' : '--remote', '--file', fichier
  ], { stdio: 'inherit' });
} finally {
  fs.unlinkSync(fichier);
}

console.log('\n  ' + combien + ' lien' + (combien > 1 ? 's' : '') +
  ', valable' + (combien > 1 ? 's' : '') + ' ' + jours + ' jours, à usage unique :\n');
jetons.forEach(function (jeton) {
  console.log('    ' + base + '/?s=' + jeton);
});
console.log('');
