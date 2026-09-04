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
  var contenu = charger(chemin);
  /*
   * Ancien format : le fichier était un objet de jetons. Il est relu tel quel
   * et rangé sous sa clé, pour qu'une mise à jour ne perde aucun lien émis.
   */
  var jetons = contenu.jetons || contenu;
  var simulations = contenu.simulations || {};

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
    fs.writeFileSync(
      temporaire,
      JSON.stringify({ jetons: jetons, simulations: simulations }, null, 2),
      'utf8'
    );
    fs.renameSync(temporaire, chemin);
  }

  return {
    creer: function (jeton, donnees) {
      jetons[jeton] = {
        officine: (donnees && donnees.officine) || '',
        creeLe: new Date().toISOString(),
        expireLe: (donnees && donnees.expireLe) || null,
        consommeLe: null,
        supprimeLe: null
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

    /* Les lignes supprimées restent comptées : voir le dépôt D1. */
    compterDepuis: function (iso) {
      return Object.keys(jetons).filter(function (j) {
        return jetons[j].creeLe >= iso;
      }).length;
    },

    lister: function (limite) {
      return Object.keys(jetons)
        .filter(function (jeton) { return !jetons[jeton].supprimeLe; })
        .map(function (jeton) {
          var e = jetons[jeton];
          return { jeton: jeton, officine: e.officine, creeLe: e.creeLe,
                   expireLe: e.expireLe, consommeLe: e.consommeLe };
        })
        .sort(function (a, b) { return a.creeLe < b.creeLe ? 1 : -1; })
        .slice(0, limite);
    },

    /* Suppression logique : la ligne demeure, plus rien ne l'ouvre. */
    supprimer: function (jeton) {
      var entree = jetons[jeton];
      if (!entree || entree.supprimeLe) return false;
      entree.supprimeLe = new Date().toISOString();
      enregistrer();
      return true;
    },

    /* Une simulation par jeton : une seconde écriture ne remplace pas. */
    enregistrerSimulation: function (jeton, donnees) {
      if (Object.prototype.hasOwnProperty.call(simulations, jeton)) return;
      simulations[jeton] = {
        jeton: jeton,
        officine: donnees.officine,
        telephone: donnees.telephone,
        simuleLe: donnees.simuleLe,
        total: donnees.total,
        nbLaboratoires: donnees.nbLaboratoires,
        remise: donnees.remise,
        tauxMoyen: donnees.tauxMoyen,
        detail: donnees.detail
      };
      enregistrer();
    },

    listerSimulations: function (limite) {
      return Object.keys(simulations)
        .map(function (jeton) { return simulations[jeton]; })
        .sort(function (a, b) { return a.simuleLe < b.simuleLe ? 1 : -1; })
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
