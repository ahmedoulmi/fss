/*
 * MASSAR — Gestion des liens de simulation.
 *
 * Page réservée à Massar. La clé voyage dans l'adresse : on met la page en
 * favori une fois, et on n'a plus rien à taper. Sans clé, elle ne montre rien
 * et le serveur ne répond pas.
 *
 * Cette page ne voit jamais un taux : elle ne manipule que des jetons.
 */
(function () {
  'use strict';

  var TEXTES = {
    sansCle: 'Cette page demande une clé d’accès. Ouvrez-la par le lien mis en '
      + 'favori, celui qui se termine par « ?k=… ».',
    cleRefusee: 'Clé refusée. Vérifiez le lien mis en favori.',
    plafond: 'Plafond quotidien atteint. Il protège contre un usage abusif de '
      + 'la clé ; il se relève dans la configuration si le besoin est réel.',
    reseau: 'Le serveur n’a pas répondu. Réessayez.',
    creeLe: 'Créé le',
    etats: { 'en-attente': 'en attente', utilise: 'utilisé', expire: 'expiré' },
    aucun: 'Aucun lien émis pour l’instant.',
    aucuneSimulation: 'Aucune simulation enregistrée pour l’instant.',
    simulationsIllisibles: 'Les simulations n’ont pas pu être lues. Si c’est la '
      + 'première fois, la table « simulations » n’existe probablement pas '
      + 'encore dans la base — voir COMMENT_LANCER_TELEPHONE.md.',
    laboratoires: 'laboratoires',
    lien: 'lien',
    detail: 'Détail',
    masquer: 'Masquer',
    copie: 'Copié',
    copier: 'Copier',
    envoyer: 'Envoyer',
    supprimer: 'Supprimer',
    confirmerSuppression: 'Supprimer ce lien ? Il cessera aussitôt de '
      + 'fonctionner, y compris s’il a déjà été envoyé.',
    suppressionRatee: 'La suppression n’a pas abouti. Rechargez la page.'
  };

  var cle = '';
  var el = {};

  function initialiser() {
    appliquerCharte(MASSAR_CHARTE);
    ['titre-admin', 'admin-sans-cle', 'admin-creation', 'admin-officine',
     'btn-creer', 'lien-neuf', 'lien-neuf-libelle', 'lien-neuf-adresse',
     'btn-copier', 'btn-envoyer', 'admin-erreur', 'admin-liste', 'liens',
     'admin-simulations', 'simulations',
     'logo', 'marque'].forEach(function (id) { el[id] = document.getElementById(id); });

    poserLogo();

    try {
      cle = new URLSearchParams(window.location.search).get('k') || '';
    } catch (e) { cle = ''; }

    if (!cle) {
      el['admin-sans-cle'].textContent = TEXTES.sansCle;
      el['admin-sans-cle'].hidden = false;
      return;
    }

    el['admin-creation'].hidden = false;
    el['admin-liste'].hidden = false;
    el['admin-simulations'].hidden = false;
    if (navigator.share) el['btn-envoyer'].hidden = false;

    el['btn-creer'].addEventListener('click', creer);
    el['btn-copier'].addEventListener('click', copier);
    el['btn-envoyer'].addEventListener('click', envoyer);
    rafraichir();
  }

  function poserLogo() {
    function present() { el.logo.hidden = false; el.marque.hidden = true; }
    function absent() { if (el.logo.parentNode) el.logo.remove(); }
    if (el.logo.complete) return el.logo.naturalWidth > 0 ? present() : absent();
    el.logo.addEventListener('load', present);
    el.logo.addEventListener('error', absent);
  }

  /*
   * Chemin absolu, et non relatif : Cloudflare sert cette page à /admin après
   * une redirection depuis /admin.html, et un chemin relatif se résoudrait
   * alors différemment. Les deux serveurs ne routent que sur /api/ absolu.
   */
  function adresse(route) {
    return new URL('/api/admin/' + route, window.location.href).toString();
  }

  function erreur(message) {
    el['admin-erreur'].textContent = message;
    el['admin-erreur'].hidden = false;
  }

  function creer() {
    el['admin-erreur'].hidden = true;
    el['btn-creer'].disabled = true;

    fetch(adresse('liens'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ k: cle, officine: el['admin-officine'].value.trim() })
    })
      .then(function (r) { return r.json(); })
      .then(function (reponse) {
        el['btn-creer'].disabled = false;
        if (reponse.statut === 'plafond-atteint') return erreur(TEXTES.plafond);
        if (reponse.statut !== 'ok') return erreur(TEXTES.cleRefusee);

        el['lien-neuf-adresse'].textContent = reponse.lien;
        el['lien-neuf-libelle'].textContent = el['admin-officine'].value.trim()
          || 'Nouveau lien';
        el['lien-neuf'].hidden = false;
        el['admin-officine'].value = '';
        el['btn-copier'].textContent = TEXTES.copier;
        rafraichir();
      })
      .catch(function () {
        el['btn-creer'].disabled = false;
        erreur(TEXTES.reseau);
      });
  }

  function copier() {
    copierTexte(el['lien-neuf-adresse'].textContent, el['btn-copier'],
      el['lien-neuf-adresse']);
  }

  function copierTexte(texte, bouton, element) {
    var fait = function () {
      var avant = bouton.textContent;
      bouton.textContent = TEXTES.copie;
      setTimeout(function () { bouton.textContent = avant; }, 2000);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texte).then(fait, secours);
    } else {
      secours();
    }
    // Sans presse-papiers, on sélectionne le texte : la copie reste possible.
    function secours() {
      if (!element) return;
      var plage = document.createRange();
      plage.selectNodeContents(element);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(plage);
    }
  }

  function envoyer() {
    partager(el['lien-neuf-adresse'].textContent);
  }

  function partager(texte) {
    if (navigator.share) navigator.share({ url: texte }).catch(function () {});
  }

  /*
   * Suppression d'un lien.
   *
   * Le lien meurt pour de bon : celui qui le détiendrait déjà ne verra plus
   * qu'un lien non valide. D'où la confirmation, qui le dit sans détour.
   */
  function supprimerLien(jeton, bouton) {
    if (!window.confirm(TEXTES.confirmerSuppression)) return;
    el['admin-erreur'].hidden = true;
    bouton.disabled = true;

    fetch(adresse('liens') + '?k=' + encodeURIComponent(cle)
          + '&j=' + encodeURIComponent(jeton), { method: 'DELETE' })
      .then(function (r) { return r.json(); })
      .then(function (reponse) {
        if (reponse.statut !== 'ok') {
          bouton.disabled = false;
          return erreur(reponse.statut === 'requete-invalide'
            ? TEXTES.cleRefusee : TEXTES.suppressionRatee);
        }
        rafraichir();
      })
      .catch(function () {
        bouton.disabled = false;
        erreur(TEXTES.reseau);
      });
  }

  /* L'adresse d'un lien se reconstitue depuis son jeton : rien à mémoriser. */
  function adresseDuLien(jeton) {
    return new URL('/?s=' + jeton, window.location.href).toString();
  }

  function rafraichir() {
    fetch(adresse('liens') + '?k=' + encodeURIComponent(cle))
      .then(function (r) { return r.json(); })
      .then(function (reponse) {
        if (reponse.statut !== 'ok') return erreur(TEXTES.cleRefusee);
        afficherListe(reponse.liens || []);
      })
      .catch(function () { erreur(TEXTES.reseau); });

    /*
     * Un échec ici ne doit pas se traduire par une section vide : vide se lit
     * « aucune simulation », ce qui est faux et fait chercher au mauvais
     * endroit. La zone porte donc elle-même son message.
     */
    fetch(adresse('simulations') + '?k=' + encodeURIComponent(cle))
      .then(function (r) { return r.json(); })
      .then(function (reponse) {
        if (reponse.statut === 'ok') {
          return afficherSimulations(reponse.simulations || []);
        }
        annoncerDansSimulations(reponse.statut === 'requete-invalide'
          ? TEXTES.cleRefusee : TEXTES.simulationsIllisibles);
      })
      .catch(function () { annoncerDansSimulations(TEXTES.reseau); });
  }

  function annoncerDansSimulations(message) {
    el.simulations.textContent = '';
    el.simulations.appendChild(paragraphe(message, 'message-blocage'));
  }

  /*
   * Simulations enregistrées. Le détail par laboratoire reste replié : la
   * liste doit rester lisible sur un téléphone, et ces montants n'ont pas à
   * s'étaler à l'écran dès l'ouverture de la page.
   */
  function afficherSimulations(lignes) {
    var zone = el.simulations;
    zone.textContent = '';

    if (lignes.length === 0) {
      zone.appendChild(paragraphe(TEXTES.aucuneSimulation, 'consigne'));
      return;
    }

    lignes.forEach(function (s) {
      var bloc = document.createElement('div');
      bloc.className = 'simulation';

      var entete = document.createElement('div');
      entete.className = 'lien-ligne';

      var gauche = document.createElement('div');
      gauche.appendChild(paragraphe(s.nom + ' ' + s.prenom, 'lien-officine'));
      gauche.appendChild(paragraphe(
        MassarCalcul.formaterTelephone(s.telephone) + ' — ' + dateCourte(s.simuleLe),
        'lien-date'));
      // Le libellé que Massar a donné au lien : de quoi voir d'un coup d'œil
      // si celui qui a rempli est bien celui à qui le lien a été envoyé.
      if (s.lien) {
        gauche.appendChild(paragraphe(TEXTES.lien + ' « ' + s.lien + ' »', 'lien-date'));
      }
      gauche.appendChild(paragraphe(
        montant(s.total) + ' · ' + s.nbLaboratoires + ' ' + TEXTES.laboratoires
          + ' · ' + montant(s.remise),
        'simulation-chiffres'));

      var droite = document.createElement('div');
      droite.className = 'lien-actions';

      var detail = document.createElement('div');
      detail.className = 'simulation-detail';
      detail.hidden = true;
      (s.detail || []).forEach(function (l) {
        var ligne = document.createElement('div');
        ligne.className = 'simulation-detail-ligne';
        var nom = document.createElement('span');
        nom.textContent = l.nom || l.id;
        var valeur = document.createElement('span');
        valeur.textContent = montant(l.montant);
        ligne.appendChild(nom);
        ligne.appendChild(valeur);
        detail.appendChild(ligne);
      });

      var bascule = document.createElement('button');
      bascule.type = 'button';
      bascule.className = 'bouton bouton-menu';
      bascule.textContent = TEXTES.detail;
      bascule.addEventListener('click', function () {
        detail.hidden = !detail.hidden;
        bascule.textContent = detail.hidden ? TEXTES.detail : TEXTES.masquer;
      });
      droite.appendChild(bascule);

      entete.appendChild(gauche);
      entete.appendChild(droite);
      bloc.appendChild(entete);
      bloc.appendChild(detail);
      zone.appendChild(bloc);
    });
  }

  /* Même écriture des montants que sur le simulateur : espaces et « DA ». */
  function montant(valeur) {
    return MassarCalcul.formaterMontant(valeur);
  }

  function afficherListe(liens) {
    var zone = el.liens;
    zone.textContent = '';

    if (liens.length === 0) {
      zone.appendChild(paragraphe(TEXTES.aucun, 'consigne'));
      return;
    }

    liens.forEach(function (lien) {
      var ligne = document.createElement('div');
      ligne.className = 'lien-ligne';

      var gauche = document.createElement('div');
      gauche.appendChild(paragraphe(lien.officine || '—', 'lien-officine'));
      gauche.appendChild(paragraphe(TEXTES.creeLe + ' ' + dateCourte(lien.creeLe),
        'lien-date'));

      var droite = document.createElement('div');
      droite.className = 'lien-actions';

      var etat = document.createElement('span');
      etat.className = 'lien-etat lien-etat-' + lien.etat;
      etat.textContent = TEXTES.etats[lien.etat];
      droite.appendChild(etat);

      // Un lien encore en attente doit pouvoir être renvoyé sans le recréer.
      if (lien.etat === 'en-attente') {
        var url = adresseDuLien(lien.jeton);

        var copie = document.createElement('button');
        copie.type = 'button';
        copie.className = 'bouton bouton-menu';
        copie.textContent = TEXTES.copier;
        copie.addEventListener('click', function () { copierTexte(url, copie, null); });
        droite.appendChild(copie);

        if (navigator.share) {
          var envoi = document.createElement('button');
          envoi.type = 'button';
          envoi.className = 'bouton bouton-menu';
          envoi.textContent = TEXTES.envoyer;
          envoi.addEventListener('click', function () { partager(url); });
          droite.appendChild(envoi);
        }
      }

      // Sur toutes les lignes : un lien déjà utilisé encombre la liste autant
      // qu'un autre, et rien n'oblige à le garder sous les yeux.
      var retrait = document.createElement('button');
      retrait.type = 'button';
      retrait.className = 'bouton bouton-menu bouton-retrait';
      retrait.textContent = TEXTES.supprimer;
      retrait.addEventListener('click', function () {
        supprimerLien(lien.jeton, retrait);
      });
      droite.appendChild(retrait);

      ligne.appendChild(gauche);
      ligne.appendChild(droite);
      zone.appendChild(ligne);
    });
  }

  function paragraphe(contenu, classe) {
    var p = document.createElement('p');
    if (classe) p.className = classe;
    p.textContent = contenu;
    return p;
  }

  function dateCourte(iso) {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      }).format(new Date(iso));
    } catch (e) { return iso; }
  }

  document.addEventListener('DOMContentLoaded', initialiser);
})();
