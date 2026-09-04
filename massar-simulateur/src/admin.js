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
    copie: 'Copié',
    copier: 'Copier',
    envoyer: 'Envoyer'
  };

  var cle = '';
  var el = {};

  function initialiser() {
    appliquerCharte(MASSAR_CHARTE);
    ['titre-admin', 'admin-sans-cle', 'admin-creation', 'admin-officine',
     'btn-creer', 'lien-neuf', 'lien-neuf-libelle', 'lien-neuf-adresse',
     'btn-copier', 'btn-envoyer', 'admin-erreur', 'admin-liste', 'liens',
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
