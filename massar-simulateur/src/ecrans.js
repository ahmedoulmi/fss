/*
 * MASSAR — Parcours en trois écrans (SPEC §4).
 *
 * Cette page ne connaît ni les taux ni la remise. Elle demande la liste des
 * laboratoires au serveur, additionne les montants saisis pour afficher le
 * total en continu, et lui envoie la saisie une seule fois pour obtenir trois
 * chiffres : remise, total, taux moyen.
 *
 * Aucune règle de calcul ici : tout passe par MassarCalcul.
 */
(function () {
  'use strict';

  var calcul = MassarCalcul;
  var textes = MASSAR_TEXTES;

  var etat = {
    jeton: jetonDepuisAdresse(),
    officine: '',
    telephone: '',
    montants: {},
    laboratoires: [],
    dateValidite: ''
  };

  var el = {};

  function initialiser() {
    appliquerCharte(MASSAR_CHARTE);
    recenserElements();
    poserTextes();

    el['btn-commencer'].addEventListener('click', function () {
      var officine = el.officine.value.trim();
      var telephone = el.telephone.value.trim();

      if (!calcul.nomValide(officine)) return refuserAccueil(textes.accueil.nomManquant);
      if (!calcul.telephoneValide(telephone)) {
        return refuserAccueil(textes.accueil.telephoneManquant);
      }

      el['accueil-erreur'].hidden = true;
      etat.officine = officine;
      etat.telephone = calcul.normaliserTelephone(telephone);
      afficherEcran('saisie');
    });
    el['btn-resultat'].addEventListener('click', envoyerSimulation);
    el['btn-imprimer'].addEventListener('click', function () { window.print(); });

    chargerLaboratoires();
  }

  function refuserAccueil(message) {
    el['accueil-erreur'].textContent = message;
    el['accueil-erreur'].hidden = false;
  }

  /* Le jeton voyage dans l'adresse : .../?s=<jeton> */
  function jetonDepuisAdresse() {
    try {
      return new URLSearchParams(window.location.search).get('s') || '';
    } catch (e) {
      return '';
    }
  }

  function recenserElements() {
    ['officine', 'telephone', 'accueil-erreur', 'accueil-conservation',
     'btn-commencer', 'liste-laboratoires', 'total-saisie',
     'message-blocage', 'btn-resultat', 'identification', 'remise-montant',
     'total-resultat', 'moyenne-mensuelle', 'moyenne-libelle',
     'recapitulatif-corps', 'remise-taux', 'btn-imprimer',
     'logo', 'marque',
     'titre-accueil', 'accueil-presentation', 'accueil-consigne', 'titre-saisie',
     'saisie-consigne', 'total-saisie-libelle', 'titre-resultat',
     'total-resultat-libelle', 'recapitulatif-titre', 'colonne-laboratoire',
     'colonne-montant', 'mentions', 'avant-fermeture',
     'titre-message', 'message-corps', 'signature'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

    el.ecrans = {
      accueil: document.getElementById('ecran-accueil'),
      saisie: document.getElementById('ecran-saisie'),
      resultat: document.getElementById('ecran-resultat'),
      message: document.getElementById('ecran-message')
    };
  }

  /* Tous les libellés viennent de textes.js, aucun n'est écrit dans le HTML. */
  function poserTextes() {
    el.signature.textContent = SIGNATURE;
    poserLogo();
    el['titre-accueil'].textContent = textes.accueil.titre;
    textes.accueil.presentation.forEach(function (phrase) {
      el['accueil-presentation'].appendChild(paragraphe(phrase, 'presentation'));
    });
    document.querySelector('label[for="officine"]').textContent =
      textes.accueil.officine;
    document.querySelector('label[for="telephone"]').textContent =
      textes.accueil.telephone;
    el['accueil-conservation'].textContent = textes.accueil.conservation;

    el['accueil-consigne'].textContent = textes.saisie.consigne[0];
    el['btn-commencer'].textContent = textes.accueil.bouton;

    el['titre-saisie'].textContent = textes.saisie.titre;
    textes.saisie.consigne.forEach(function (phrase) {
      el['saisie-consigne'].appendChild(paragraphe(phrase));
    });
    el['total-saisie-libelle'].textContent = textes.saisie.total;
    el['btn-resultat'].textContent = textes.saisie.bouton;

    el['titre-resultat'].textContent = textes.resultat.libelle;
    el['total-resultat-libelle'].textContent = textes.resultat.total;
    el['moyenne-libelle'].textContent = textes.resultat.moyenneMensuelle;
    el['recapitulatif-titre'].textContent = textes.resultat.recapitulatif;
    el['colonne-laboratoire'].textContent = textes.resultat.colonneLaboratoire;
    el['colonne-montant'].textContent = textes.resultat.colonneMontant;
    el['avant-fermeture'].textContent = textes.resultat.avantFermeture;
    el['btn-imprimer'].textContent = textes.resultat.bouton;
  }

  /*
   * Le logo prend la place de la marque typographique s'il est présent.
   * Le chargement de l'image commence dès l'analyse du HTML, donc bien avant
   * ce code : on regarde d'abord si l'affaire est déjà jouée, sinon on écoute.
   */
  function poserLogo() {
    function present() {
      el.logo.hidden = false;
      el.marque.hidden = true;
    }
    function absent() {
      if (el.logo.parentNode) el.logo.remove();
    }

    if (el.logo.complete) {
      return el.logo.naturalWidth > 0 ? present() : absent();
    }
    el.logo.addEventListener('load', present);
    el.logo.addEventListener('error', absent);
  }

  function paragraphe(contenu, classe) {
    var p = document.createElement('p');
    if (classe) p.className = classe;
    p.textContent = contenu;
    return p;
  }

  /* Un lien absent ou inconnu n'a pas « déjà servi » : le dire correctement. */
  function finPourStatut(statut) {
    if (statut === 'jeton-consomme') return textes.expire;
    if (statut === 'jeton-expire') return textes.perime;
    return textes.invalide;
  }

  function chargerLaboratoires() {
    if (!etat.jeton) return afficherFin(textes.invalide);

    demander('laboratoires?s=' + encodeURIComponent(etat.jeton), null)
      .then(function (reponse) {
        if (!reponse) return afficherFin(textes.erreur);
        if (reponse.statut !== 'ok') return afficherFin(finPourStatut(reponse.statut));
        etat.laboratoires = reponse.laboratoires;
        etat.dateValidite = reponse.dateValidite;
        poserMentions();
        construireLignes();
        rafraichirSaisie();
        afficherEcran('accueil');
      })
      .catch(function () { afficherFin(textes.erreur); });
  }

  function poserMentions() {
    el.mentions.textContent = '';
    textes.mentions.forEach(function (mention) {
      el.mentions.appendChild(paragraphe(mention.replace('{date}', etat.dateValidite)));
    });
  }

  /* Tous les laboratoires affichés d'emblée (SPEC §4). */
  function construireLignes() {
    var fragment = document.createDocumentFragment();

    etat.laboratoires.forEach(function (labo) {
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
   * Additionner ne demande aucun taux ; aucune remise n'est calculable ici.
   */
  function rafraichirSaisie() {
    var totaux = calcul.calculerTotaux(etat.montants, etat.laboratoires);
    var conditions = calcul.evaluerConditions(totaux);

    el['total-saisie'].textContent = calcul.formaterMontant(totaux.totalCommandes);
    el['btn-resultat'].disabled = !conditions.accessible;

    if (conditions.accessible || totaux.totalCommandes === 0) {
      el['message-blocage'].hidden = true;
      el['message-blocage'].textContent = '';
      return;
    }

    el['message-blocage'].hidden = false;
    el['message-blocage'].textContent = textes.blocage(
      calcul.decrireManque(conditions), textes.courriel
    );
  }

  /* Le seul appel qui consomme le jeton. */
  function envoyerSimulation() {
    var totaux = calcul.calculerTotaux(etat.montants, etat.laboratoires);
    if (!calcul.evaluerConditions(totaux).accessible) return;

    el['btn-resultat'].disabled = true;

    demander('simuler', {
      jeton: etat.jeton,
      montants: etat.montants,
      identite: { officine: etat.officine, telephone: etat.telephone }
    })
      .then(function (reponse) {
        if (!reponse) return afficherFin(textes.erreur);
        if (reponse.statut === 'ok') {
          afficherResultat(reponse.resultat, totaux);
          return afficherEcran('resultat');
        }
        if (reponse.statut === 'conditions-non-remplies') {
          el['btn-resultat'].disabled = false;
          return rafraichirSaisie();
        }
        /*
         * Le serveur revalide l'identité et peut la refuser là où la page
         * l'avait acceptée. Le jeton est alors intact : on ramène à l'accueil
         * pour corriger, plutôt que d'annoncer un lien mort qui ne l'est pas.
         */
        if (reponse.statut === 'identite-invalide') {
          el['btn-resultat'].disabled = false;
          refuserAccueil(textes.accueil.telephoneManquant);
          return afficherEcran('accueil');
        }
        afficherFin(finPourStatut(reponse.statut));
      })
      .catch(function () { afficherFin(textes.erreur); });
  }

  function afficherResultat(resultat, totaux) {
    el.identification.textContent = ligneIdentification();
    el['remise-montant'].textContent = calcul.formaterMontant(resultat.remise);
    el['total-resultat'].textContent = calcul.formaterMontant(resultat.totalCommandes);
    // Le total saisi est annuel : sa moyenne mensuelle en est le douzième.
    el['moyenne-mensuelle'].textContent =
      calcul.formaterMontant(calcul.moyenneMensuelle(resultat.totalCommandes));
    el['remise-taux'].textContent = calcul.formaterTaux(resultat.tauxMoyen);
    el['remise-taux'].setAttribute('title', textes.resultat.tauxMoyen);

    var corps = el['recapitulatif-corps'];
    corps.textContent = '';

    // Nom et montant saisi uniquement : ni remise ni taux par ligne (SPEC §8).
    totaux.lignes.forEach(function (ligne) {
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

  function afficherFin(bloc) {
    el['titre-message'].textContent = bloc.titre;
    el['message-corps'].textContent = '';
    var corps = Array.isArray(bloc.corps) ? bloc.corps : [bloc.corps];
    corps.forEach(function (phrase) {
      el['message-corps'].appendChild(
        paragraphe(phrase.replace('{courriel}', textes.courriel), 'presentation')
      );
    });
    afficherEcran('message');
  }

  function demander(route, charge) {
    var options = charge === null
      ? { method: 'GET' }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(charge)
        };
    // Chemin absolu : c'est ce que routent les deux serveurs, quel que soit
    // le chemin auquel la page elle-même a été servie.
    var adresse = new URL('/api/' + route, window.location.href).toString();
    return fetch(adresse, options).then(function (r) { return r.json(); });
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
