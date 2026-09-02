/*
 * MASSAR — Parcours en trois écrans (SPEC §4).
 * Aucune règle de calcul ici : tout passe par MassarCalcul.
 */
(function () {
  'use strict';

  var calcul = MassarCalcul;
  var bareme = MASSAR_BAREME;

  var etat = { montants: {}, officine: '' };

  var el = {};

  function initialiser() {
    appliquerCharte(MASSAR_CHARTE);

    ['banniere-exemple', 'officine', 'btn-commencer', 'liste-laboratoires',
     'total-saisie', 'message-blocage', 'btn-resultat', 'identification',
     'remise-montant', 'total-resultat', 'recapitulatif-corps', 'taux-moyen',
     'date-validite', 'btn-imprimer'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

    el.ecrans = {
      accueil: document.getElementById('ecran-accueil'),
      saisie: document.getElementById('ecran-saisie'),
      resultat: document.getElementById('ecran-resultat')
    };

    // Garde-fou : un livrable réel ne doit jamais partir avec le barème d'exemple.
    if (bareme.exemple) {
      el['banniere-exemple'].hidden = false;
    }

    el['date-validite'].textContent = bareme.dateValidite;

    construireLignes();
    rafraichirSaisie();

    el['btn-commencer'].addEventListener('click', function () {
      etat.officine = el.officine.value.trim();
      afficherEcran('saisie');
    });

    el['btn-resultat'].addEventListener('click', function () {
      var resultat = calcul.calculer(etat.montants, bareme);
      if (!calcul.evaluerConditions(resultat).accessible) return;
      afficherResultat(resultat);
      afficherEcran('resultat');
    });

    el['btn-imprimer'].addEventListener('click', function () {
      window.print();
    });
  }

  /* Tous les laboratoires du barème, affichés d'emblée (SPEC §4). */
  function construireLignes() {
    var fragment = document.createDocumentFragment();

    bareme.laboratoires.forEach(function (labo) {
      var ligne = document.createElement('div');
      ligne.className = 'ligne-laboratoire';

      var label = document.createElement('label');
      label.className = 'ligne-nom';
      label.setAttribute('for', 'montant-' + labo.id);
      label.textContent = labo.nom;

      var enveloppe = document.createElement('div');
      enveloppe.className = 'ligne-champ';

      var champ = document.createElement('input');
      champ.type = 'text';
      champ.id = 'montant-' + labo.id;
      champ.className = 'montant';
      champ.inputMode = 'numeric';
      champ.autocomplete = 'off';
      champ.setAttribute('aria-describedby', 'unite-' + labo.id);

      var unite = document.createElement('span');
      unite.className = 'ligne-unite';
      unite.id = 'unite-' + labo.id;
      unite.textContent = 'DA';

      champ.addEventListener('input', function () {
        var caret = champ.selectionStart;
        var chiffresAvantCaret = compterChiffres(champ.value.slice(0, caret));

        var normalise = calcul.normaliserSaisie(champ.value);
        var affichage = normalise === '' ? '' : calcul.formaterEntier(Number(normalise));
        etat.montants[labo.id] = normalise === '' ? 0 : Number(normalise);

        // Le champ se reformate à chaque frappe : on replace le curseur
        // derrière le même chiffre, sinon il saute en fin de ligne.
        if (champ.value !== affichage) {
          champ.value = affichage;
          var position = positionApresChiffres(affichage, chiffresAvantCaret);
          try { champ.setSelectionRange(position, position); } catch (e) {}
        }

        rafraichirSaisie();
      });

      enveloppe.appendChild(champ);
      enveloppe.appendChild(unite);
      ligne.appendChild(label);
      ligne.appendChild(enveloppe);
      fragment.appendChild(ligne);
    });

    el['liste-laboratoires'].appendChild(fragment);
  }

  /*
   * Écran 2 : total actualisé en continu, et rien d'autre.
   * Aucune remise, aucun taux à ce stade (SPEC §4).
   */
  function rafraichirSaisie() {
    var resultat = calcul.calculer(etat.montants, bareme);
    var conditions = calcul.evaluerConditions(resultat);

    el['total-saisie'].textContent = calcul.formaterMontant(resultat.totalCommandes);
    el['btn-resultat'].disabled = !conditions.accessible;

    if (conditions.accessible || resultat.totalCommandes === 0) {
      el['message-blocage'].hidden = true;
      el['message-blocage'].textContent = '';
      return;
    }

    el['message-blocage'].hidden = false;
    el['message-blocage'].textContent =
      calcul.decrireManque(conditions) + ' ' +
      'La simulation nécessite au moins ' + calcul.CONSTANTES.MIN_LABORATOIRES +
      ' laboratoires renseignés et un total d’achats d’au moins ' +
      calcul.formaterMontant(calcul.CONSTANTES.MIN_TOTAL_COMMANDES) + '. ' +
      'Pour une estimation adaptée à votre situation, prenons rendez-vous.';
  }

  function afficherResultat(resultat) {
    el.identification.textContent = ligneIdentification();
    el['remise-montant'].textContent = calcul.formaterMontant(resultat.remiseAffichee);
    el['total-resultat'].textContent = calcul.formaterMontant(resultat.totalCommandes);
    el['taux-moyen'].textContent = calcul.formaterTaux(resultat.tauxMoyen);

    var corps = el['recapitulatif-corps'];
    corps.textContent = '';

    // Nom et montant saisi uniquement : ni remise ni taux par ligne (SPEC §8).
    resultat.lignes.forEach(function (ligne) {
      var tr = document.createElement('tr');
      var nom = document.createElement('td');
      nom.textContent = ligne.nom;
      var montant = document.createElement('td');
      montant.className = 'montant-cellule';
      montant.textContent = calcul.formaterMontant(ligne.montant);
      tr.appendChild(nom);
      tr.appendChild(montant);
      corps.appendChild(tr);
    });
  }

  function ligneIdentification() {
    var parties = [];
    if (etat.officine) parties.push(etat.officine);
    parties.push('Simulation du ' + dateDuJour());
    return parties.join(' — ');
  }

  function dateDuJour() {
    var options = { day: 'numeric', month: 'long', year: 'numeric' };
    try {
      return new Intl.DateTimeFormat('fr-FR', options).format(new Date());
    } catch (e) {
      return new Date().toLocaleDateString();
    }
  }

  function compterChiffres(texte) {
    var trouves = texte.match(/\d/g);
    return trouves ? trouves.length : 0;
  }

  function positionApresChiffres(texte, nbChiffres) {
    if (nbChiffres <= 0) return 0;
    var vus = 0;
    for (var i = 0; i < texte.length; i++) {
      if (texte[i] >= '0' && texte[i] <= '9') {
        vus += 1;
        if (vus === nbChiffres) return i + 1;
      }
    }
    return texte.length;
  }

  function afficherEcran(nom) {
    Object.keys(el.ecrans).forEach(function (cle) {
      el.ecrans[cle].hidden = cle !== nom;
    });
    window.scrollTo(0, 0);
    var titre = el.ecrans[nom].querySelector('h1');
    if (titre) {
      titre.setAttribute('tabindex', '-1');
      titre.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', initialiser);
})();
