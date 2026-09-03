/*
 * Dépôt de jetons sur fichier — durable d'un redémarrage à l'autre.
 *
 * Un fichier JSON suffit à cette échelle : quelques centaines de jetons, un
 * seul processus. Node traite les requêtes une par une, donc `consommer` est
 * atomique de fait : aucune interruption ne peut s'intercaler entre la lecture
 * et l'écriture du drapeau.
 *
 * Si l'hébergement retenu fait tourner PLUSIEURS processus en parallèle, ce
 * dépôt ne convient plus — il faudra une base ou un stockage clé-valeur qui
 * garantisse une écriture conditionnelle. Le contrat, lui, ne change pas.
 */
var fs = require('node:fs');
var path = require('node:path');

function creerDepotFichier(chemin) {
  var jetons = charger(chemin);

  function charger(cible) {
    try {
      return JSON.parse(fs.readFileSync(cible, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  /* Écriture par fichier temporaire puis renommage : jamais de fichier à
     moitié écrit si le processus s'arrête au mauvais moment. */
  function enregistrer() {
    var dossier = path.dirname(chemin);
    fs.mkdirSync(dossier, { recursive: true });
    var temporaire = chemin + '.' + process.pid + '.tmp';
    fs.writeFileSync(temporaire, JSON.stringify(jetons, null, 2), 'utf8');
    fs.renameSync(temporaire, chemin);
  }

  return {
    creer: function (jeton, donnees) {
      jetons[jeton] = {
        officine: (donnees && donnees.officine) || '',
        creeLe: new Date().toISOString(),
        expireLe: (donnees && donnees.expireLe) || null,
        consommeLe: null
      };
      enregistrer();
      return jeton;
    },

    lire: function (jeton) {
      return Object.prototype.hasOwnProperty.call(jetons, jeton)
        ? jetons[jeton]
        : null;
    },

    consommer: function (jeton) {
      var entree = jetons[jeton];
      if (!entree || entree.consommeLe !== null) return false;
      entree.consommeLe = new Date().toISOString();
      enregistrer();
      return true;
    },

    compterDepuis: function (iso) {
      return Object.keys(jetons).filter(function (j) {
        return jetons[j].creeLe >= iso;
      }).length;
    },

    lister: function (limite) {
      return Object.keys(jetons)
        .map(function (jeton) {
          var e = jetons[jeton];
          return { jeton: jeton, officine: e.officine, creeLe: e.creeLe,
                   expireLe: e.expireLe, consommeLe: e.consommeLe };
        })
        .sort(function (a, b) { return a.creeLe < b.creeLe ? 1 : -1; })
        .slice(0, limite);
    },

    /* Journal minimal : ni montants, ni remise (SPEC §1 — pas de collecte). */
    journal: function () {
      return Object.keys(jetons).map(function (jeton) {
        return {
          jeton: jeton,
          creeLe: jetons[jeton].creeLe,
          expireLe: jetons[jeton].expireLe,
          consommeLe: jetons[jeton].consommeLe
        };
      });
    }
  };
}

module.exports = creerDepotFichier;
