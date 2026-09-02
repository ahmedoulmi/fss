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
        .prepare('SELECT officine, cree_le, expire_le, consomme_le FROM jetons WHERE jeton = ?1')
        .bind(jeton)
        .first();
      if (!ligne) return null;
      return {
        officine: ligne.officine,
        creeLe: ligne.cree_le,
        expireLe: ligne.expire_le,
        consommeLe: ligne.consomme_le
      };
    },

    /* true une seule fois par jeton, même sous requêtes concurrentes. */
    async consommer(jeton) {
      const resultat = await base
        .prepare('UPDATE jetons SET consomme_le = ?1 WHERE jeton = ?2 AND consomme_le IS NULL')
        .bind(new Date().toISOString(), jeton)
        .run();
      return resultat.meta.changes === 1;
    }
  };
}
