/*
 * MASSAR — Cœur serveur (lot 4).
 *
 * Deux garanties, et c'est tout l'intérêt du lien à usage unique :
 *   1. Le barème ne quitte jamais ce processus. La page reçoit des noms de
 *      laboratoires, jamais un taux.
 *   2. Un jeton ne produit qu'un seul résultat. Il est consommé AVANT le
 *      calcul : en cas d'incident, on échoue fermé plutôt que d'ouvrir un
 *      second usage.
 *
 * Aucune dépendance à un hébergement : l'adaptateur HTTP appelle ces fonctions.
 */
var calcul = require('../src/calcul.js');

var STATUTS = {
  OK: 'ok',
  JETON_INCONNU: 'jeton-inconnu',
  JETON_CONSOMME: 'jeton-consomme',
  JETON_EXPIRE: 'jeton-expire',
  CONDITIONS: 'conditions-non-remplies',
  REQUETE_INVALIDE: 'requete-invalide'
};

function creerNoyau(options) {
  var bareme = options.bareme;
  var depot = options.depot;
  // Injectable pour les tests : sinon l'expiration ne se vérifie qu'en attendant.
  var maintenant = options.maintenant || function () { return Date.now(); };

  /*
   * Vérifie qu'un jeton est vivant, sans le consommer.
   *
   * Asynchrone parce qu'un dépôt distant l'est : une base D1 ou un stockage
   * clé-valeur répond par une promesse. Les dépôts locaux renvoient une valeur
   * directe, qu'un await traverse sans dommage.
   */
  async function etatJeton(jeton) {
    if (typeof jeton !== 'string' || jeton === '') return STATUTS.REQUETE_INVALIDE;
    var entree = await depot.lire(jeton);
    if (!entree) return STATUTS.JETON_INCONNU;
    if (entree.consommeLe !== null) return STATUTS.JETON_CONSOMME;
    // Un lien envoyé puis oublié ne doit pas rester ouvrable indéfiniment :
    // le barème vieillit, et sa date de validité avec lui (SPEC §10).
    if (entree.expireLe && maintenant() > Date.parse(entree.expireLe)) {
      return STATUTS.JETON_EXPIRE;
    }
    return STATUTS.OK;
  }

  /*
   * Ce que la page a le droit de connaître : la liste fermée des laboratoires
   * (SPEC §3) et la date de validité, pour les mentions (SPEC §6).
   * Le taux est retiré ici, une fois pour toutes.
   *
   * Réservé aux porteurs d'un jeton vivant : la liste des laboratoires
   * démarchés par Massar n'a pas à être publique.
   */
  async function laboratoiresPour(jeton) {
    var statut = await etatJeton(jeton);
    if (statut !== STATUTS.OK) return { statut: statut };
    return {
      statut: STATUTS.OK,
      dateValidite: bareme.dateValidite,
      laboratoires: bareme.laboratoires.map(function (labo) {
        return { id: labo.id, nom: labo.nom };
      })
    };
  }

  /*
   * Les montants viennent d'une page qui peut avoir été modifiée : on ne leur
   * fait aucune confiance. Chaque valeur repasse par la normalisation de
   * saisie, et les conditions d'accès sont revalidées ici.
   */
  function assainirMontants(brut) {
    var propres = {};
    if (!brut || typeof brut !== 'object') return propres;
    bareme.laboratoires.forEach(function (labo) {
      if (!Object.prototype.hasOwnProperty.call(brut, labo.id)) return;
      var montant = montantRecevable(brut[labo.id]);
      if (montant > 0) propres[labo.id] = montant;
    });
    return propres;
  }

  /*
   * Une chaîne passe par la normalisation de saisie. Un nombre, lui, doit être
   * un entier positif tel quel : on écarte un montant négatif ou décimal
   * plutôt que d'en réinterpréter le signe ou les décimales.
   */
  function montantRecevable(valeur) {
    if (typeof valeur === 'number') {
      if (!isFinite(valeur) || valeur < 0 || Math.floor(valeur) !== valeur) return 0;
      return Math.min(valeur, calcul.CONSTANTES.PLAFOND_LIGNE);
    }
    if (typeof valeur === 'string') return calcul.montantDepuisSaisie(valeur);
    return 0;
  }

  async function simuler(jeton, montantsBruts) {
    var statut = await etatJeton(jeton);
    if (statut !== STATUTS.OK) return { statut: statut };

    var montants = assainirMontants(montantsBruts);
    var totaux = calcul.calculerTotaux(montants, bareme.laboratoires);
    var conditions = calcul.evaluerConditions(totaux);

    // Conditions non remplies : rien n'est calculé, donc rien n'est divulgué,
    // donc le jeton reste vivant. La page n'aurait pas dû envoyer la requête.
    if (!conditions.accessible) {
      return { statut: STATUTS.CONDITIONS, conditions: conditions };
    }

    // Le jeton meurt ici. Un second appel repartira sur JETON_CONSOMME.
    // Le dépôt doit garantir qu'un seul appelant obtient true, même si deux
    // requêtes arrivent en même temps.
    if (!(await depot.consommer(jeton))) {
      return { statut: STATUTS.JETON_CONSOMME };
    }

    var remise = calcul.calculerRemise(totaux, bareme);

    // Seuls des agrégats sortent : ni taux unitaire, ni remise par ligne.
    return {
      statut: STATUTS.OK,
      resultat: {
        remise: remise.remiseAffichee,
        totalCommandes: totaux.totalCommandes,
        tauxMoyen: remise.tauxMoyen
      }
    };
  }

  return {
    etatJeton: etatJeton,
    laboratoiresPour: laboratoiresPour,
    simuler: simuler
  };
}

module.exports = { creerNoyau: creerNoyau, STATUTS: STATUTS };
