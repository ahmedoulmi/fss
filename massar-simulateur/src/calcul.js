/*
 * MASSAR — Règles de calcul (SPEC §2).
 *
 * Fonctions pures, sans DOM : ce fichier est chargé tel quel par le navigateur
 * et importé par les tests. Toute règle de calcul vit ici et nulle part ailleurs.
 */
var MassarCalcul = (function () {
  'use strict';

  var CONSTANTES = {
    MIN_LABORATOIRES: 5,          // SPEC §4 — condition d'accès au résultat
    MIN_TOTAL_COMMANDES: 1000000, // SPEC §4 — en dinars
    PLAFOND_LIGNE: 1000000000     // garde-fou contre la faute de frappe
  };

  /*
   * Saisie : dinars entiers positifs, sans décimale (SPEC §2).
   * Tout caractère non numérique est écarté à la frappe, le plafond est
   * appliqué silencieusement.
   */
  function normaliserSaisie(texte) {
    var chiffres = String(texte == null ? '' : texte).replace(/\D/g, '');
    chiffres = chiffres.replace(/^0+(?=\d)/, '');
    if (chiffres === '') return '';
    var valeur = Number(chiffres);
    if (valeur > CONSTANTES.PLAFOND_LIGNE) return String(CONSTANTES.PLAFOND_LIGNE);
    return chiffres;
  }

  function montantDepuisSaisie(texte) {
    var normalise = normaliserSaisie(texte);
    return normalise === '' ? 0 : Number(normalise);
  }

  /*
   * Une ligne n'est « renseignée » que si son montant est strictement positif :
   * une ligne vide n'est pas comptée (SPEC §2), et un 0 saisi non plus.
   */
  function estRenseignee(montant) {
    return typeof montant === 'number' && isFinite(montant) && montant > 0;
  }

  /*
   * Aucun arrondi intermédiaire : la remise est sommée en valeur exacte et
   * n'est arrondie qu'à l'affichage.
   */
  function calculer(montantsParId, bareme) {
    var lignes = [];
    var totalCommandes = 0;
    var remiseExacte = 0;

    bareme.laboratoires.forEach(function (labo) {
      var montant = (montantsParId && montantsParId[labo.id]) || 0;
      if (!estRenseignee(montant)) return;
      totalCommandes += montant;
      remiseExacte += montant * labo.taux;
      lignes.push({ id: labo.id, nom: labo.nom, montant: montant });
    });

    return {
      lignes: lignes,
      nbLaboratoires: lignes.length,
      totalCommandes: totalCommandes,
      remiseExacte: remiseExacte,
      remiseAffichee: Math.round(remiseExacte),
      tauxMoyen: totalCommandes > 0 ? (remiseExacte / totalCommandes) * 100 : 0
    };
  }

  /*
   * Conditions cumulatives d'accès au résultat (SPEC §4).
   * On renvoie ce qui manque, pas seulement un refus.
   */
  function evaluerConditions(resultat) {
    var laboratoiresManquants = Math.max(
      0, CONSTANTES.MIN_LABORATOIRES - resultat.nbLaboratoires
    );
    var montantManquant = Math.max(
      0, CONSTANTES.MIN_TOTAL_COMMANDES - resultat.totalCommandes
    );
    return {
      accessible: laboratoiresManquants === 0 && montantManquant === 0,
      laboratoiresManquants: laboratoiresManquants,
      montantManquant: montantManquant
    };
  }

  /* Ce qui manque, en toutes lettres. */
  function decrireManque(conditions) {
    var morceaux = [];
    if (conditions.laboratoiresManquants > 0) {
      morceaux.push(
        conditions.laboratoiresManquants === 1
          ? 'un laboratoire'
          : conditions.laboratoiresManquants + ' laboratoires'
      );
    }
    if (conditions.montantManquant > 0) {
      morceaux.push(formaterMontant(conditions.montantManquant));
    }
    if (morceaux.length === 0) return '';
    return 'Il manque ' + morceaux.join(' et ') + '.';
  }

  function formaterNombre(valeur, decimales) {
    var options = {
      minimumFractionDigits: decimales || 0,
      maximumFractionDigits: decimales || 0
    };
    try {
      return new Intl.NumberFormat('fr-FR', options).format(valeur);
    } catch (e) {
      return String(valeur);
    }
  }

  /* Entier lisible, sans unité : utilisé dans les champs de saisie. */
  function formaterEntier(valeur) {
    return formaterNombre(Math.round(valeur), 0);
  }

  function formaterMontant(valeur) {
    return formaterEntier(valeur) + ' DA';
  }

  /* Taux moyen : une décimale (SPEC §2). */
  function formaterTaux(pourcentage) {
    return formaterNombre(pourcentage, 1) + ' %';
  }

  return {
    CONSTANTES: CONSTANTES,
    normaliserSaisie: normaliserSaisie,
    montantDepuisSaisie: montantDepuisSaisie,
    estRenseignee: estRenseignee,
    calculer: calculer,
    evaluerConditions: evaluerConditions,
    decrireManque: decrireManque,
    formaterEntier: formaterEntier,
    formaterMontant: formaterMontant,
    formaterTaux: formaterTaux
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MassarCalcul;
}
