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

/*
 * 3. L'étanchéité du barème — le contrôle central
 *
 * Deux signaux, parce qu'un seul ne suffit pas.
 *
 * Le nom d'un laboratoire dans un fichier servi est une fuite en soi : la page
 * ne doit connaître la liste que par l'API, jamais en dur.
 *
 * Pour les taux, chercher le nombre brut ne vaut rien : un taux rond comme
 * 0,25 ou 0,2 se retrouve dans n'importe quelle feuille de style — 0.25rem,
 * 0.2s — sans rien divulguer. On ne retient donc que les occurrences hors
 * contexte d'unité, celles qui ressemblent à une donnée et non à une mesure.
 */
var servis = fs.readdirSync(path.join(RACINE, 'src'))
  .filter(function (nom) { return /\.(html|css|js)$/.test(nom); });

/*
 * Certaines fonctions CSS prennent des décimales NUES — l'alpha d'un rgba(),
 * les points de contrôle d'un cubic-bezier(). Sans unité pour les distinguer,
 * elles sont indiscernables d'un taux, et une ombre à 0,15 d'opacité fait
 * lever une fuite là où il n'y en a pas. Un contrôle qui crie à tort finit par
 * ne plus être écouté : on neutralise donc leurs arguments avant l'examen.
 *
 * La liste est fermée à dessein. Aucune de ces fonctions ne saurait porter un
 * barème, et le nom du laboratoire, lui, reste cherché dans le texte entier.
 */
var FONCTIONS_GEOMETRIQUES =
  /\b(?:rgba?|hsla?|cubic-bezier|steps|scale|scale[XYZ]|translate|translate[XYZ]|rotate|skew|matrix|matrix3d)\s*\([^)]*\)/gi;

function sansValeursGeometriques(contenu) {
  return contenu.replace(FONCTIONS_GEOMETRIQUES, function (bloc) {
    return bloc.replace(/[\d.]/g, '0');
  });
}

function occurrencesHorsUnite(contenu, valeur) {
  var texte = String(valeur);
  var trouvees = 0;
  var depuis = 0;
  var index;
  while ((index = contenu.indexOf(texte, depuis)) !== -1) {
    var avant = index === 0 ? '' : contenu[index - 1];
    var apres = contenu[index + texte.length] || '';
    // 0.25rem, 0.2s, 0.3% : une mesure, pas une donnée.
    var mesure = /[a-zA-Z%]/.test(apres);
    // « 0.2 » trouvé à l'intérieur de « 0.22em » : ce n'est pas le taux.
    var tronque = /[\d.]/.test(apres);
    var fragment = /[\d.]/.test(avant);
    if (!mesure && !tronque && !fragment) trouvees += 1;
    depuis = index + texte.length;
  }
  return trouvees;
}

servis.forEach(function (nom) {
  var brut = fs.readFileSync(path.join(RACINE, 'src', nom), 'utf8');
  var contenu = sansValeursGeometriques(brut);
  (bareme.laboratoires || []).forEach(function (labo) {
    if (labo.nom && contenu.indexOf(labo.nom) !== -1) {
      manques.push('FUITE : le nom de « ' + labo.nom + ' » apparaît dans src/' +
        nom + '. La page ne doit connaître la liste que par l’API.');
    }
    if (typeof labo.taux === 'number' && occurrencesHorsUnite(contenu, labo.taux) > 0) {
      manques.push('FUITE : le taux de « ' + labo.nom + ' » apparaît dans src/' +
        nom + ', hors contexte d’unité.');
    }
  });
});

/*
 * 4. Le vocabulaire (règles permanentes de Massar Development)
 *
 * « Groupement » et le vocabulaire d'achat collectif sont frappés d'interdit
 * absolu : ils revendiquent une forme juridique que Massar n'a pas, et
 * laissent croire à un pharmacien qu'il engage son patrimoine personnel.
 * Le contrôle porte sur ce qui est servi au navigateur, commentaires compris —
 * un terme proscrit n'a rien à y faire, même hors du texte visible.
 */
var PROSCRITS = /groupement|achat group|centrale d'|centrale de saisie|mutualis|\bGIE\b|du groupe\b|Massar Group\b|Xpert Pharmacie/i;

servis.forEach(function (nom) {
  var contenu = fs.readFileSync(path.join(RACINE, 'src', nom), 'utf8');
  contenu.split('\n').forEach(function (ligne, rang) {
    if (PROSCRITS.test(ligne)) {
      manques.push('VOCABULAIRE : terme proscrit dans src/' + nom +
        ', ligne ' + (rang + 1) + '.');
    }
  });
});

/* Verdict */
if (manques.length === 0) {
  console.log('\n  ✓ Rien ne s’oppose à la mise en service.');
  console.log('    ' + servis.length + ' fichiers servis vérifiés : aucun taux,');
  console.log('    aucun terme proscrit par les règles de vocabulaire.\n');
  process.exit(0);
}

console.log('\n  ✗ Mise en service impossible — ' + manques.length + ' point' +
  (manques.length > 1 ? 's' : '') + ' :\n');
manques.forEach(function (manque) { console.log('    · ' + manque); });
console.log('');
process.exit(1);
