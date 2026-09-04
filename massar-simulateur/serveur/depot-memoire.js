/*
 * Dépôt de jetons en mémoire — développement et tests.
 *
 * L'implémentation réelle (SQLite en fichier, ou stockage clé-valeur selon
 * l'hébergement retenu) devra respecter ce contrat, et surtout garantir que
 * `consommer` est atomique : deux appels simultanés sur le même jeton ne
 * doivent jamais renvoyer true tous les deux.
 */
function creerDepotMemoire() {
  var jetons = new Map();
  var simulations = new Map();

  return {
    creer: function (jeton, donnees) {
      jetons.set(jeton, {
        officine: (donnees && donnees.officine) || '',
        creeLe: new Date().toISOString(),
        expireLe: (donnees && donnees.expireLe) || null,
        consommeLe: null,
        supprimeLe: null
      });
      return jeton;
    },

    lire: function (jeton) {
      return jetons.get(jeton) || null;
    },

    /* true une seule fois par jeton, jamais ensuite. */
    consommer: function (jeton) {
      var entree = jetons.get(jeton);
      if (!entree || entree.consommeLe !== null) return false;
      entree.consommeLe = new Date().toISOString();
      return true;
    },

    /* Les lignes supprimées restent comptées : voir le dépôt D1. */
    compterDepuis: function (iso) {
      var n = 0;
      jetons.forEach(function (e) { if (e.creeLe >= iso) n += 1; });
      return n;
    },

    lister: function (limite) {
      var lignes = [];
      jetons.forEach(function (e, jeton) {
        if (e.supprimeLe) return;
        lignes.push({ jeton: jeton, officine: e.officine, creeLe: e.creeLe,
                      expireLe: e.expireLe || null, consommeLe: e.consommeLe });
      });
      return lignes.sort(function (a, b) { return a.creeLe < b.creeLe ? 1 : -1; })
                   .slice(0, limite);
    },

    /* Suppression logique : la ligne demeure, plus rien ne l'ouvre. */
    supprimer: function (jeton) {
      var entree = jetons.get(jeton);
      if (!entree || entree.supprimeLe) return false;
      entree.supprimeLe = new Date().toISOString();
      return true;
    },


    /* Une simulation par jeton : une seconde écriture ne remplace pas. */
    enregistrerSimulation: function (jeton, donnees) {
      if (simulations.has(jeton)) return;
      simulations.set(jeton, {
        jeton: jeton,
        nom: donnees.nom,
        prenom: donnees.prenom,
        telephone: donnees.telephone,
        simuleLe: donnees.simuleLe,
        total: donnees.total,
        nbLaboratoires: donnees.nbLaboratoires,
        remise: donnees.remise,
        tauxMoyen: donnees.tauxMoyen,
        detail: donnees.detail
      });
    },

    /* Le libellé du lien vient de la ligne de jeton : une seule vérité. */
    listerSimulations: function (limite) {
      var lignes = [];
      simulations.forEach(function (s, jeton) {
        var jetonLigne = jetons.get(jeton);
        lignes.push(Object.assign({}, s, {
          lien: (jetonLigne && jetonLigne.officine) || ''
        }));
      });
      return lignes.sort(function (a, b) { return a.simuleLe < b.simuleLe ? 1 : -1; })
                   .slice(0, limite);
    },

    /* Journal minimal : ni montants, ni remise (SPEC §1 — pas de collecte). */
    journal: function () {
      var lignes = [];
      jetons.forEach(function (entree, jeton) {
        lignes.push({
          jeton: jeton,
          creeLe: entree.creeLe,
          consommeLe: entree.consommeLe
        });
      });
      return lignes;
    }
  };
}

module.exports = creerDepotMemoire;
