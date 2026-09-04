/*
 * MASSAR — Tous les textes affichés, en un seul endroit.
 * Registre : accueillant. Aucune formule n'est écrite ailleurs dans le code.
 */
var MASSAR_TEXTES = {

  /* Affichée sur le message de blocage et les écrans de fin, jamais sur
     l'écran résultat ni sur le document imprimé (SPEC §8). */
  courriel: 'contact@massardevelopment.com',

  accueil: {
    titre: 'Simulateur de remise',
    presentation: [
      // Formulation reprise des tournures autorisées par les règles
      // permanentes de vocabulaire. La phrase proposée par la spécification
      // employait un terme frappé d’interdit absolu : il désigne en droit
      // algérien une forme juridique à responsabilité solidaire, que Massar
      // Development — SARL — n’a pas, et laisserait croire à un pharmacien
      // qu’il engage son patrimoine personnel. Voir build/verifier.js.
      'Massar Development négocie les conditions d’achat auprès des laboratoires '
        + 'et des grossistes, pour les pharmacies d’officine.',
      'Estimez le montant de remise que vous pourriez percevoir sur vos achats annuels.'
    ],
    bouton: 'Commencer la simulation',
    officine: 'Nom de l’officine',
    officineFacultatif: '(facultatif)'
  },

  saisie: {
    titre: 'Vos achats annuels',
    consigne: [
      'Indiquez vos achats annuels par laboratoire, en dinars, hors taxes.',
      'Laissez vide les laboratoires qui ne vous concernent pas.'
    ],
    total: 'Total des commandes saisies',
    bouton: 'Voir ma remise estimée'
  },

  /*
   * Message de blocage (SPEC §4).
   * L'invitation « prenons rendez-vous » est retirée : on n'invite pas à une
   * action sans en donner le moyen. Une adresse est affichée ici, et ici
   * seulement — jamais sur l'écran résultat ni sur le document imprimé.
   */
  blocage: function (manque, courriel) {
    return [
      manque,
      'En deçà de 5 laboratoires et de 1 000 000 DA d’achats annuels, ' +
        'l’estimation ne serait pas représentative de ce que Massar peut vous apporter.',
      'Écrivez-nous à ' + courriel + ', nous regarderons votre situation.'
    ].join(' ');
  },

  resultat: {
    libelle: 'Remise annuelle estimée',
    total: 'Total des commandes saisies',
    moyenneMensuelle: 'Moyenne mensuelle',
    recapitulatif: 'Détail par laboratoire',
    colonneLaboratoire: 'Laboratoire',
    colonneMontant: 'Montant saisi',
    tauxMoyen: 'Taux moyen de remise',
    bouton: 'Imprimer le récapitulatif',
    /* Le lien meurt après le calcul : le prospect doit le savoir avant de fermer. */
    avantFermeture: 'Pensez à imprimer ce récapitulatif : il ne sera plus ' +
      'accessible après fermeture de cette page.'
  },

  mentions: [
    'Simulation fondée sur les montants que vous saisissez.',
    'Les remises effectivement obtenues dépendent des conditions, paliers et '
      + 'clauses propres à chaque fournisseur et à chaque laboratoire.',
    'Conditions au {date}.'
  ],

  invalide: {
    titre: 'Lien non valide',
    corps: [
      'Ce lien de simulation n’est pas reconnu. Il a peut-être été tronqué en '
        + 'chemin, ou recopié incomplètement.',
      'Écrivez-nous à {courriel} pour en recevoir un nouveau.'
    ]
  },

  expire: {
    titre: 'Simulation déjà effectuée',
    corps: [
      'Ce lien ne peut servir qu’une seule fois, et il a déjà été utilisé.',
      'Écrivez-nous à {courriel} pour en recevoir un nouveau.'
    ]
  },

  perime: {
    titre: 'Lien arrivé à échéance',
    corps: [
      'Ce lien de simulation a passé sa date de validité. Les conditions ont ' +
        'pu changer depuis son envoi.',
      'Écrivez-nous à {courriel} pour en recevoir un nouveau.'
    ]
  },

  erreur: {
    titre: 'Simulation indisponible',
    corps: 'Le calcul n’a pas abouti. Réessayez dans un instant, ou ' +
      'écrivez-nous à {courriel}.'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MASSAR_TEXTES;
}
