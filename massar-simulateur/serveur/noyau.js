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
  REQUETE_INVALIDE: 'requete-invalide',
  IDENTITE_INVALIDE: 'identite-invalide',
  PLAFOND_ATTEINT: 'plafond-atteint'
};

/* Validité d'un lien, et nombre maximum d'émissions sur 24 heures. */
var JOURS_DE_VALIDITE = 3;
var PLAFOND_QUOTIDIEN = 30;

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
    // Un lien supprimé n'existe plus pour qui le détient : rien ne distingue
    // sa réponse de celle d'un jeton jamais émis.
    if (entree.supprimeLe) return STATUTS.JETON_INCONNU;
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

  /*
   * Identité déclarée par le pharmacien. Revalidée ici : la page peut avoir
   * été modifiée, et un enregistrement sans nom ni téléphone exploitable
   * n'aurait aucune valeur.
   */
  function identiteRecevable(brut) {
    var nom = String((brut && brut.nom) || '').trim().slice(0, 40);
    var prenom = String((brut && brut.prenom) || '').trim().slice(0, 40);
    var telephone = calcul.normaliserTelephone(brut && brut.telephone);
    if (!calcul.nomValide(nom) || !calcul.nomValide(prenom)) return null;
    if (telephone === '') return null;
    return { nom: nom, prenom: prenom, telephone: telephone };
  }

  async function simuler(jeton, montantsBruts, identiteBrute) {
    var statut = await etatJeton(jeton);
    if (statut !== STATUTS.OK) return { statut: statut };

    // Contrôlée avant toute autre chose : le jeton ne doit pas mourir pour
    // une saisie que l'on refusera ensuite.
    var identite = identiteRecevable(identiteBrute);
    if (!identite) return { statut: STATUTS.IDENTITE_INVALIDE };

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

    /*
     * Enregistrement (SPEC § 1, révisé). Après le calcul, et sans pouvoir
     * l'empêcher : si l'écriture échoue, le pharmacien voit tout de même son
     * résultat — le jeton est déjà consommé, le lui refuser le priverait de
     * tout sans rien sauver.
     */
    try {
      await depot.enregistrerSimulation(jeton, {
        nom: identite.nom,
        prenom: identite.prenom,
        telephone: identite.telephone,
        simuleLe: new Date(maintenant()).toISOString(),
        total: totaux.totalCommandes,
        nbLaboratoires: totaux.lignes.length,
        remise: remise.remiseAffichee,
        tauxMoyen: remise.tauxMoyen,
        detail: totaux.lignes.map(function (l) {
          return { id: l.id, nom: l.nom, montant: l.montant };
        })
      });
    } catch (e) { /* le résultat prime sur la trace */ }

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

  /*
   * Émission d'un lien.
   *
   * Le plafond quotidien ne protège pas le barème — quelqu'un qui tiendrait la
   * clé d'administration finirait par le déduire en émettant sur plusieurs
   * jours. Il borne les dégâts et rend l'abus visible dans le journal. La vraie
   * réponse à une clé volée est de la changer.
   */
  async function emettreLien(options) {
    var plafond = (options && options.plafondQuotidien) || PLAFOND_QUOTIDIEN;
    var depuis = new Date(maintenant() - 24 * 3600 * 1000).toISOString();

    if (await depot.compterDepuis(depuis) >= plafond) {
      return { statut: STATUTS.PLAFOND_ATTEINT, plafond: plafond };
    }

    var jours = (options && options.jours) || JOURS_DE_VALIDITE;
    var echeance = new Date(maintenant() + jours * 24 * 3600 * 1000).toISOString();
    var jeton = options.jeton;

    await depot.creer(jeton, {
      officine: (options && options.officine) || '',
      expireLe: echeance
    });
    return { statut: STATUTS.OK, jeton: jeton, expireLe: echeance };
  }

  /*
   * Suppression d'un lien émis.
   *
   * La ligne n'est pas effacée mais marquée : elle continue de peser dans le
   * plafond quotidien. Effacer pour de bon offrirait à qui tient la clé un
   * moyen simple de le contourner, et le plafond est ce qui rend visible
   * l'émission en masse par laquelle le barème se déduirait.
   */
  async function supprimerLien(jeton) {
    if (typeof jeton !== 'string' || jeton === '') {
      return { statut: STATUTS.REQUETE_INVALIDE };
    }
    if (!(await depot.supprimer(jeton))) return { statut: STATUTS.JETON_INCONNU };
    return { statut: STATUTS.OK };
  }

  /* Simulations enregistrées, la plus récente d'abord. */
  async function listerSimulations(limite) {
    return depot.listerSimulations(limite || 50);
  }

  /* État de chaque lien émis. */
  async function listerLiens(limite) {
    var lignes = await depot.lister(limite || 50);
    var instant = maintenant();
    return lignes.map(function (l) {
      var etat = 'en-attente';
      if (l.consommeLe) etat = 'utilise';
      else if (l.expireLe && instant > Date.parse(l.expireLe)) etat = 'expire';
      return {
        jeton: l.jeton, officine: l.officine, creeLe: l.creeLe,
        expireLe: l.expireLe, consommeLe: l.consommeLe, etat: etat
      };
    });
  }

  return {
    etatJeton: etatJeton,
    emettreLien: emettreLien,
    supprimerLien: supprimerLien,
    listerLiens: listerLiens,
    listerSimulations: listerSimulations,
    laboratoiresPour: laboratoiresPour,
    simuler: simuler
  };
}

module.exports = {
  creerNoyau: creerNoyau,
  STATUTS: STATUTS,
  JOURS_DE_VALIDITE: JOURS_DE_VALIDITE,
  PLAFOND_QUOTIDIEN: PLAFOND_QUOTIDIEN
};
