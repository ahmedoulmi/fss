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
        expireLe: (donnees && donnees.expireLe) || null,
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

    compterDepuis: function (iso) {
      var n = 0;
      jetons.forEach(function (e) { if (e.creeLe >= iso) n += 1; });
      return n;
    },

    lister: function (limite) {
      var lignes = [];
      jetons.forEach(function (e, jeton) {
        lignes.push({ jeton: jeton, officine: e.officine, creeLe: e.creeLe,
                      expireLe: e.expireLe || null, consommeLe: e.consommeLe });
      });
      return lignes.sort(function (a, b) { return a.creeLe < b.creeLe ? 1 : -1; })
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
