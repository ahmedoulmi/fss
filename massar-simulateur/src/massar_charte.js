/*
 * MASSAR — Charte
 * Source unique des couleurs, polices et de l'échelle typographique (SPEC §7).
 * Aucune de ces valeurs ne doit être écrite en dur ailleurs : la feuille de
 * style ne consomme que les variables CSS produites par ce fichier.
 *
 * Les valeurs viennent de la charte Massar Development, révision du 28 août
 * 2026 : la marque est VERT ET OR, l'or au même rang que le vert.
 *
 * Le rouge est d'usage fonctionnel uniquement — alerte, point d'attention.
 * Jamais décoratif, jamais un fond.
 */
/*
 * Signature arrêtée le 31 août 2026. Ne jamais la réécrire en dur ailleurs :
 * elle se reporte partout depuis ici.
 */
var SIGNATURE = 'Plus qu’un service, un écosystème';

var MASSAR_CHARTE = {
  /*
   * Valeurs reprises de massar_charte.js, le module de charte de Massar
   * Development (révision du 28 août 2026). Mêmes noms de jetons, pour que
   * les deux fichiers se lisent l'un l'autre.
   */
  provisoire: false,

  couleurs: {
    vertFonce: '#0B5227',   // couleur de marque — fonds sombres, surfaces d'identité
    vert: '#1E8F3C',        // couleur d'interaction — accents actifs
    vertClair: '#8FD6A6',   // aplats secondaires, texte sur fond sombre
    or: '#B8912F',          // couleur de marque, au même rang que le vert
    orClair: '#D9BC72',     // or sur fond sombre, où le B8912F manque de contraste
    fond: '#F4F6F5',
    texte: '#1E2A24',
    gris: '#6B7671',        // texte secondaire, légendes
    blanc: '#FFFFFF',
    bordure: '#E3E8E5',

    /* USAGE FONCTIONNEL UNIQUEMENT — alerte, point d'attention.
       Jamais décoratif, jamais un fond. */
    rouge: '#D81E28'
  },

  typographie: {
    /* Arial pour les titres, toujours en gras ; Calibri pour le corps.
       Les replis couvrent les postes qui n'ont ni l'une ni l'autre :
       Carlito a les mêmes métriques que Calibri. */
    familleTitres: "Arial, Helvetica, 'Liberation Sans', sans-serif",
    familleTexte: "Calibri, Carlito, 'Segoe UI', system-ui, Arial, sans-serif",
    familleChiffres: "Calibri, Carlito, 'Segoe UI', system-ui, Arial, sans-serif",
    graisseNormale: '400',
    graisseAppuyee: '700',
    interligne: '1.55',
    interligneTitre: '1.15'
  },

  echelle: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    md: '1.125rem',
    lg: '1.375rem',
    xl: '1.75rem',
    xxl: '2.25rem',
    resultat: 'clamp(2.5rem, 9vw, 4rem)'
  },

  espacement: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2.5rem',
    xxl: '4rem'
  },

  formes: {
    rayon: '4px',
    rayonLarge: '8px',
    epaisseurTrait: '1px',
    largeurPage: '52rem'
  }
};

/*
 * Traduit la charte en variables CSS sur :root.
 * Chemin `couleurs.encre` -> `--m-couleurs-encre`.
 * Ajouter un jeton à la charte suffit : aucun câblage à faire ici.
 */
function appliquerCharte(charte, cible) {
  var racine = (cible || document.documentElement).style;

  function parcourir(objet, chemin) {
    Object.keys(objet).forEach(function (cle) {
      var valeur = objet[cle];
      var segments = chemin.concat(kebab(cle));
      if (valeur && typeof valeur === 'object') {
        parcourir(valeur, segments);
      } else if (typeof valeur === 'string' || typeof valeur === 'number') {
        racine.setProperty('--m-' + segments.join('-'), String(valeur));
      }
    });
  }

  parcourir(charte, []);
}

function kebab(texte) {
  return texte.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MASSAR_CHARTE: MASSAR_CHARTE,
    SIGNATURE: SIGNATURE,
    appliquerCharte: appliquerCharte
  };
}
