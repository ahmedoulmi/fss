/*
 * MASSAR — Adaptateur HTTP.
 *
 * Sert la page et expose deux routes. C'est la seule couche qui changera si
 * l'hébergement retenu n'est pas un serveur Node : le noyau, lui, ne bouge pas.
 *
 *   GET  api/laboratoires?s=<jeton>  liste des laboratoires, sans aucun taux
 *   POST api/simuler                 { jeton, montants } -> agrégats, une fois
 */
var http = require('node:http');
var fs = require('node:fs');
var path = require('node:path');

var { STATUTS } = require('./noyau.js');

var TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

function creerServeur(options) {
  var noyau = options.noyau;
  var racine = options.racine;

  return http.createServer(function (requete, reponse) {
    var adresse = new URL(requete.url, 'http://' + (requete.headers.host || 'localhost'));

    if (adresse.pathname === '/api/laboratoires') {
      return routeLaboratoires(noyau, adresse, reponse);
    }
    if (adresse.pathname === '/api/simuler') {
      return routeSimuler(noyau, requete, reponse);
    }
    return servirFichier(racine, adresse.pathname, reponse);
  });
}

/*
 * La liste des laboratoires est réservée aux porteurs d'un jeton vivant : elle
 * n'a pas à être publique, et un jeton déjà consommé n'ouvre plus rien.
 * Lire la liste ne consomme pas le jeton.
 */
function routeLaboratoires(noyau, adresse, reponse) {
  var jeton = adresse.searchParams.get('s') || '';
  noyau.laboratoiresPour(jeton)
    .then(function (charge) { envoyerJson(reponse, 200, charge); })
    .catch(function () { envoyerJson(reponse, 500, { statut: 'erreur' }); });
}

function routeSimuler(noyau, requete, reponse) {
  if (requete.method !== 'POST') {
    return envoyerJson(reponse, 405, { statut: STATUTS.REQUETE_INVALIDE });
  }

  var morceaux = [];
  var taille = 0;

  requete.on('data', function (morceau) {
    taille += morceau.length;
    if (taille > 64 * 1024) {           // une saisie légitime pèse quelques kilo-octets
      requete.destroy();
      return;
    }
    morceaux.push(morceau);
  });

  requete.on('end', function () {
    var charge;
    try {
      charge = JSON.parse(Buffer.concat(morceaux).toString('utf8'));
    } catch (e) {
      return envoyerJson(reponse, 400, { statut: STATUTS.REQUETE_INVALIDE });
    }
    noyau.simuler(charge && charge.jeton, charge && charge.montants)
      .then(function (verdict) { envoyerJson(reponse, 200, verdict); })
      .catch(function () { envoyerJson(reponse, 500, { statut: 'erreur' }); });
  });
}

function servirFichier(racine, chemin, reponse) {
  var relatif = chemin === '/' ? 'index.html' : chemin.replace(/^\/+/, '');
  var cible = path.resolve(racine, relatif);

  // Pas de sortie du répertoire servi.
  if (cible !== racine && !cible.startsWith(racine + path.sep)) {
    reponse.writeHead(403).end();
    return;
  }

  fs.readFile(cible, function (erreur, contenu) {
    if (erreur) {
      reponse.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return reponse.end('Introuvable');
    }
    reponse.writeHead(200, {
      'Content-Type': TYPES[path.extname(cible)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    reponse.end(contenu);
  });
}

function envoyerJson(reponse, code, charge) {
  reponse.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  reponse.end(JSON.stringify(charge));
}

module.exports = { creerServeur: creerServeur };
