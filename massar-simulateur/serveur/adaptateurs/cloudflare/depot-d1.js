/*
 * Dépôt des jetons sur D1.
 *
 * Le point qui compte est `consommer`. Sur un hébergement sans état, plusieurs
 * requêtes peuvent être traitées en parallèle par des instances différentes :
 * lire puis écrire ne suffirait pas, deux appels simultanés obtiendraient tous
 * deux le feu vert. L'écriture conditionnelle ci-dessous est atomique — une
 * seule des deux voit `changes === 1`, et le jeton ne sert donc qu'une fois.
 */
export function creerDepotD1(base) {
  return {
    async creer(jeton, donnees) {
      await base
        .prepare(
          'INSERT INTO jetons (jeton, officine, cree_le, expire_le, consomme_le) ' +
          'VALUES (?1, ?2, ?3, ?4, NULL)'
        )
        .bind(
          jeton,
          (donnees && donnees.officine) || '',
          new Date().toISOString(),
          (donnees && donnees.expireLe) || null
        )
        .run();
      return jeton;
    },

    async lire(jeton) {
      const ligne = await base
        .prepare('SELECT officine, cree_le, expire_le, consomme_le, supprime_le ' +
                 'FROM jetons WHERE jeton = ?1')
        .bind(jeton)
        .first();
      if (!ligne) return null;
      return {
        officine: ligne.officine,
        creeLe: ligne.cree_le,
        expireLe: ligne.expire_le,
        consommeLe: ligne.consomme_le,
        supprimeLe: ligne.supprime_le
      };
    },

    /*
     * Les lignes supprimées restent comptées : sans cela, supprimer puis
     * réémettre suffirait à franchir le plafond quotidien autant de fois
     * qu'on veut, et le plafond ne protégerait plus rien.
     */
    async compterDepuis(iso) {
      const ligne = await base
        .prepare('SELECT COUNT(*) AS n FROM jetons WHERE cree_le >= ?1')
        .bind(iso)
        .first();
      return ligne ? ligne.n : 0;
    },

    async lister(limite) {
      const r = await base
        .prepare('SELECT jeton, officine, cree_le, expire_le, consomme_le ' +
                 'FROM jetons WHERE supprime_le IS NULL ' +
                 'ORDER BY cree_le DESC LIMIT ?1')
        .bind(limite)
        .all();
      return (r.results || []).map((l) => ({
        jeton: l.jeton, officine: l.officine, creeLe: l.cree_le,
        expireLe: l.expire_le, consommeLe: l.consomme_le
      }));
    },

    /* true une seule fois par jeton, même sous requêtes concurrentes. */
    async consommer(jeton) {
      const resultat = await base
        .prepare('UPDATE jetons SET consomme_le = ?1 WHERE jeton = ?2 AND consomme_le IS NULL')
        .bind(new Date().toISOString(), jeton)
        .run();
      return resultat.meta.changes === 1;
    },

    /*
     * Suppression logique : la ligne demeure, mais plus rien ne l'ouvre et
     * elle disparaît de la liste. Un jeton supprimé ne redevient jamais
     * valide, et son identifiant n'est pas réattribuable.
     */
    async supprimer(jeton) {
      const resultat = await base
        .prepare('UPDATE jetons SET supprime_le = ?1 WHERE jeton = ?2 AND supprime_le IS NULL')
        .bind(new Date().toISOString(), jeton)
        .run();
      return resultat.meta.changes === 1;
    },

    /*
     * Enregistrement d'une simulation.
     *
     * INSERT OR IGNORE : un jeton ne sert qu'une fois, donc une simulation
     * par jeton. Si une écriture aboutissait deux fois — reprise après
     * incident, requête rejouée — la seconde ne fait rien plutôt que de
     * remplacer la première.
     */
    async enregistrerSimulation(jeton, donnees) {
      await base
        .prepare(
          'INSERT OR IGNORE INTO simulations ' +
          '(jeton, officine, telephone, simule_le, total, nb_laboratoires, ' +
          ' remise, taux_moyen, detail) ' +
          'VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)'
        )
        .bind(
          jeton,
          donnees.officine,
          donnees.telephone,
          donnees.simuleLe,
          donnees.total,
          donnees.nbLaboratoires,
          donnees.remise,
          donnees.tauxMoyen,
          JSON.stringify(donnees.detail)
        )
        .run();
    },

    async listerSimulations(limite) {
      const r = await base
        .prepare('SELECT jeton, officine, telephone, simule_le, total, ' +
                 '       nb_laboratoires, remise, taux_moyen, detail ' +
                 'FROM simulations ORDER BY simule_le DESC LIMIT ?1')
        .bind(limite)
        .all();
      return (r.results || []).map((l) => ({
        jeton: l.jeton,
        officine: l.officine,
        telephone: l.telephone,
        simuleLe: l.simule_le,
        total: l.total,
        nbLaboratoires: l.nb_laboratoires,
        remise: l.remise,
        tauxMoyen: l.taux_moyen,
        detail: lireDetail(l.detail)
      }));
    }
  };
}

/* Un détail illisible ne doit pas faire échouer toute la liste. */
function lireDetail(brut) {
  try {
    const lu = JSON.parse(brut);
    return Array.isArray(lu) ? lu : [];
  } catch (e) {
    return [];
  }
}
