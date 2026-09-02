/*
 * MASSAR — Charte
 * Source unique des couleurs, polices et de l'échelle typographique (SPEC §7).
 * Aucune de ces valeurs ne doit être écrite en dur ailleurs : la feuille de
 * style ne consomme que les variables CSS produites par ce fichier.
 *
 * ATTENTION — VALEURS PROVISOIRES.
 * La charte Massar réelle n'a pas été fournie. Les valeurs ci-dessous sont
 * neutres et destinées à être remplacées ; `provisoire` passera à false.
 */
var MASSAR_CHARTE = {
  provisoire: true,

  couleurs: {
    encre: '#16211c',
    encreAdoucie: '#5c6b64',
    encreDiscrete: '#8b978f',
    fond: '#f6f5f1',
    surface: '#ffffff',
    bordure: '#dcdcd4',
    bordureAppuyee: '#16211c',
    accent: '#1f5c46',
    accentAdouci: '#eef3f0',
    accentContraste: '#ffffff',
    signal: '#8a5a20',
    signalFond: '#fbf3e7'
  },

  typographie: {
    familleTitres: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
    familleTexte: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    familleChiffres: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    graisseNormale: '400',
    graisseAppuyee: '600',
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
  module.exports = { MASSAR_CHARTE: MASSAR_CHARTE, appliquerCharte: appliquerCharte };
}
