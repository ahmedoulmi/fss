/*
 * MASSAR — Émission et suivi des liens.
 *
 * Partagé par les deux hébergements : le contrôle de la clé et la logique
 * d'émission ne doivent exister qu'à un seul endroit.
 *
 * Cette couche ne touche jamais au barème. Une clé volée permet de fabriquer
 * des liens, pas de lire les taux — mais fabriquer des liens suffit, à la
 * longue, à déduire le barème par différence. D'où le plafond quotidien, et
 * d'où la règle : une clé suspecte se change, elle ne se surveille pas.
 */
var { STATUTS } = require('./noyau.js');

/*
 * Comparaison à durée constante. Une comparaison ordinaire s'arrête au premier
 * caractère différent, et le temps de réponse trahit alors le préfixe correct.
 */
function memeCle(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  var ecart = 0;
  for (var i = 0; i < a.length; i++) {
    ecart |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return ecart === 0;
}

function creerAdministration(options) {
  var noyau = options.noyau;
  /*
   * Les espaces et retours à la ligne autour d'une clé n'ont jamais de sens :
   * ce sont des accidents de copie. Un secret déposé avec le saut de ligne
   * final d'un fichier texte doit rester utilisable.
   */
  var cleAttendue = String(options.cleAttendue || '').trim();
  var nouveauJeton = options.nouveauJeton;

  function cleValide(cle) {
    // Sans clé configurée, l'administration reste fermée plutôt qu'ouverte.
    if (!cleAttendue) return false;
    return memeCle(String(cle || '').trim(), cleAttendue);
  }

  async function lister(cle) {
    if (!cleValide(cle)) return { statut: STATUTS.REQUETE_INVALIDE };
    return { statut: STATUTS.OK, liens: await noyau.listerLiens(50) };
  }

  /*
   * Suppression d'un lien. Sous la même clé que l'émission : qui peut créer
   * un lien peut le retirer, et personne d'autre.
   */
  async function supprimer(cle, jeton) {
    if (!cleValide(cle)) return { statut: STATUTS.REQUETE_INVALIDE };
    return noyau.supprimerLien(String(jeton || ''));
  }

  async function emettre(cle, donnees) {
    if (!cleValide(cle)) return { statut: STATUTS.REQUETE_INVALIDE };

    var officine = String((donnees && donnees.officine) || '').slice(0, 80);
    var resultat = await noyau.emettreLien({
      jeton: nouveauJeton(),
      officine: officine
    });
    if (resultat.statut !== STATUTS.OK) return resultat;

    return {
      statut: STATUTS.OK,
      jeton: resultat.jeton,
      expireLe: resultat.expireLe,
      lien: donnees.base.replace(/\/+$/, '') + '/?s=' + resultat.jeton
    };
  }

  return {
    cleValide: cleValide,
    lister: lister,
    emettre: emettre,
    supprimer: supprimer
  };
}

module.exports = { creerAdministration: creerAdministration, memeCle: memeCle };
