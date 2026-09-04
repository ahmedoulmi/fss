/*
 * MASSAR — Règles de calcul (SPEC §2 et §4).
 *
 * Fonctions pures, sans DOM ni réseau : chargé tel quel par le navigateur,
 * importé par le serveur et par les tests.
 *
 * La séparation est structurante depuis le choix du lien à usage unique :
 *   - calculerTotaux  ne demande que la LISTE des laboratoires. Il tourne dans
 *     la page, qui n'a jamais connaissance des taux.
 *   - calculerRemise  demande le BARÈME. Il ne tourne que sur le serveur.
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
    // Tout ce qui suit un séparateur décimal est écarté : « 800000,99 » vaut
    // 800 000 DA, et non 80 000 099 comme le donnerait un simple retrait des
    // caractères non numériques.
    var entier = String(texte == null ? '' : texte).split(/[.,]/)[0];
    var chiffres = entier.replace(/\D/g, '');
    chiffres = chiffres.replace(/^0+(?=\d)/, '');
    if (chiffres === '') return '';
    if (Number(chiffres) > CONSTANTES.PLAFOND_LIGNE) {
      return String(CONSTANTES.PLAFOND_LIGNE);
    }
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
   * Sans les taux : total des commandes et lignes retenues.
   * C'est tout ce dont la page a besoin pour afficher le total en continu et
   * pour savoir si les conditions d'accès sont réunies.
   */
  function calculerTotaux(montantsParId, laboratoires) {
    var lignes = [];
    var totalCommandes = 0;

    laboratoires.forEach(function (labo) {
      var brut = montantsParId ? montantsParId[labo.id] : 0;
      var montant = typeof brut === 'number' ? brut : montantDepuisSaisie(brut);
      if (!estRenseignee(montant)) return;
      totalCommandes += montant;
      lignes.push({ id: labo.id, nom: labo.nom, montant: montant });
    });

    return {
      lignes: lignes,
      nbLaboratoires: lignes.length,
      totalCommandes: totalCommandes
    };
  }

  /*
   * Avec les taux — serveur uniquement.
   *
   * La remise est sommée en valeur exacte, sans aucun arrondi intermédiaire,
   * et n'est arrondie qu'une fois, à la fin.
   *
   * Le taux moyen est ensuite calculé sur ce montant ARRONDI, et non sur la
   * valeur exacte : c'est la division que le pharmacien peut refaire avec les
   * deux nombres qu'il a sous les yeux. Sur la valeur exacte, quatre
   * simulations sur deux cent mille affichaient un dernier chiffre différent
   * de cette division — l'écart tenait à moins d'un demi-dinar tombant sur la
   * limite d'arrondi, mais la page se serait contredite elle-même.
   */
  function calculerRemise(totaux, bareme) {
    var tauxParId = {};
    bareme.laboratoires.forEach(function (labo) { tauxParId[labo.id] = labo.taux; });

    var remiseExacte = 0;
    totaux.lignes.forEach(function (ligne) {
      remiseExacte += ligne.montant * (tauxParId[ligne.id] || 0);
    });

    var remiseAffichee = Math.round(remiseExacte);

    return {
      remiseExacte: remiseExacte,
      remiseAffichee: remiseAffichee,
      tauxMoyen: totaux.totalCommandes > 0
        ? (remiseAffichee / totaux.totalCommandes) * 100
        : 0
    };
  }

  /* Les deux d'un coup : serveur et tests. */
  function calculer(montantsParId, bareme) {
    var totaux = calculerTotaux(montantsParId, bareme.laboratoires);
    var remise = calculerRemise(totaux, bareme);
    return {
      lignes: totaux.lignes,
      nbLaboratoires: totaux.nbLaboratoires,
      totalCommandes: totaux.totalCommandes,
      remiseExacte: remise.remiseExacte,
      remiseAffichee: remise.remiseAffichee,
      tauxMoyen: remise.tauxMoyen
    };
  }

  /*
   * Conditions cumulatives d'accès au résultat (SPEC §4).
   * On renvoie ce qui manque, pas seulement un refus.
   * Évaluées dans la page pour l'affichage, revalidées sur le serveur : une
   * page modifiée ne les contourne pas.
   */
  function evaluerConditions(totaux) {
    var laboratoiresManquants = Math.max(
      0, CONSTANTES.MIN_LABORATOIRES - totaux.nbLaboratoires
    );
    var montantManquant = Math.max(
      0, CONSTANTES.MIN_TOTAL_COMMANDES - totaux.totalCommandes
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
    calculerTotaux: calculerTotaux,
    calculerRemise: calculerRemise,
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
