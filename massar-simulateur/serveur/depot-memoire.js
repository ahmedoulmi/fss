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

  return {
    creer: function (jeton, donnees) {
      jetons.set(jeton, {
        officine: (donnees && donnees.officine) || '',
        creeLe: new Date().toISOString(),
        consommeLe: null
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
