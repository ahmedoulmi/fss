/*
 * BARÈME D'EXEMPLE — VALEURS ENTIÈREMENT FICTIVES.
 *
 * Ce fichier existe pour développer et recetter l'outil sans manipuler de
 * données réelles. Les noms de laboratoires sont inventés, les taux sont
 * arbitraires. Il est versionné ; le barème réel ne l'est jamais (.gitignore).
 *
 * Le barème réel prendra la même forme, dans bareme/bareme.reel.js.
 * Taux exprimés en fraction (0.025 = 2,5 %), jamais en pourcentage.
 */
var MASSAR_BAREME = {
  exemple: true,
  dateValidite: '01/01/2026',
  laboratoires: [
    { id: 'ex-01', nom: 'Laboratoire Alpha (exemple)',   taux: 0.030 },
    { id: 'ex-02', nom: 'Laboratoire Bêta (exemple)',    taux: 0.025 },
    { id: 'ex-03', nom: 'Laboratoire Gamma (exemple)',   taux: 0.018 },
    { id: 'ex-04', nom: 'Laboratoire Delta (exemple)',   taux: 0.042 },
    { id: 'ex-05', nom: 'Laboratoire Epsilon (exemple)', taux: 0.015 },
    { id: 'ex-06', nom: 'Laboratoire Zêta (exemple)',    taux: 0.027 },
    { id: 'ex-07', nom: 'Laboratoire Êta (exemple)',     taux: 0.035 },
    { id: 'ex-08', nom: 'Laboratoire Thêta (exemple)',   taux: 0.012 },
    { id: 'ex-09', nom: 'Laboratoire Iota (exemple)',    taux: 0.022 },
    { id: 'ex-10', nom: 'Laboratoire Kappa (exemple)',   taux: 0.038 }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MASSAR_BAREME;
}
