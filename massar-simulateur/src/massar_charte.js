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

    /* Surfaces sombres. Le clair domine, le sombre PONCTUE : il marque un
       moment fort, jamais du remplissage. Ici, l'écran de résultat. */
    nuit: '#07160E',
    nuitPanneau: '#0E2418',
    nuitFilet: '#1B3B27',

    /* Jumeaux de contraste — À N'UTILISER QUE POUR DU TEXTE.
       Le vert et le gris de marque échouent au seuil de 4,5:1 en petit texte
       sur fond clair. On ne les remplace pas, on les double : les originaux
       pour les fonds, les filets et les grandes surfaces ; ceux-ci pour le
       texte. */
    vertBouton: '#1A7F35',
    grisWeb: '#5E6A64',

    /* USAGE FONCTIONNEL UNIQUEMENT — alerte, point d'attention.
       Jamais décoratif, jamais un fond. */
    rouge: '#D81E28'
  },

  typographie: {
    /*
     * Trois rôles, jamais mélangés :
     *   affiche  — les titres, en 700 ou 800
     *   texte    — le corps et les chiffres
     *   mono     — les surtitres et les boutons, jamais autre chose
     *
     * Les replis couvrent les postes qui n'ont pas la police : Carlito a les
     * mêmes métriques que Calibri, et la page reste juste si le chargement
     * des polices distantes échoue.
     */
    familleTitres: "'Bricolage Grotesque', 'Segoe UI', Arial, sans-serif",
    familleTexte: "Calibri, Carlito, 'Segoe UI', system-ui, -apple-system, sans-serif",
    familleChiffres: "Calibri, Carlito, 'Segoe UI', system-ui, Arial, sans-serif",
    familleMono: "'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace",
    graisseNormale: '400',
    graisseAppuyee: '700',
    graisseAffiche: '800',
    interligne: '1.62',
    interligneTitre: '1.1',
    interlettrageMono: '0.08em',
    interlettrageSurtitre: '0.2em'
  },

  echelle: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    md: '1.125rem',
    lg: '1.375rem',
    xl: '1.75rem',
    xxl: '2.25rem',

    /* Échelle fluide : tout en clamp, aucun palier de media query. */
    hero: 'clamp(2.1rem, 5.4vw, 4.1rem)',
    section: 'clamp(1.7rem, 3.6vw, 2.7rem)',
    page: 'clamp(1.35rem, 2.6vw, 1.9rem)',
    carte: '1.0625rem',
    chapo: '1.0625rem',
    legende: '0.8125rem',
    surtitre: '0.72rem',
    bouton: '0.82rem',
    resultat: 'clamp(2.5rem, 9vw, 4rem)'
  },

  espacement: {
    /* Un seul espacement vertical pour toutes les sections : c'est cette
       uniformité qui produit le rythme. */
    section: 'clamp(3.5rem, 9vw, 7rem)',
    margePage: 'clamp(1.25rem, 4vw, 2.5rem)',
    gapCarte: '1.5rem',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2.5rem',
    xxl: '4rem'
  },

  formes: {
    rayon: '10px',
    rayonBadge: '6px',       // plus serré que les cartes : boutons et badges
    rayonLarge: '10px',
    epaisseurTrait: '1px',
    largeurPage: '52rem',
    /* Mesure des blocs de chiffres. Un couple « libellé — montant » écarté
       sur toute la largeur de page devient illisible : l'œil perd la ligne
       entre les deux. Cette mesure les tient ensemble. */
    largeurChiffres: '26rem',
    ombreCarte: '0 2px 8px rgba(0, 0, 0, 0.12)',
    ombreBadge: '0 2px 8px rgba(0, 0, 0, 0.15)',
    /* Le mouvement se coupe sous prefers-reduced-motion ; voir styles.css. */
    easeSortie: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    easeDouce: 'cubic-bezier(0.65, 0.05, 0.36, 1)'
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
