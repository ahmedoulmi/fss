/*
 * Jeux d'essai des règles de calcul (SPEC §2 et §4).
 * Lancement : node --test tests/
 */
const test = require('node:test');
const assert = require('node:assert');

const calcul = require('../src/calcul.js');
const bareme = require('../bareme/bareme.exemple.js');

// Les formateurs produisent une espace fine insécable ; on la neutralise.
const espaces = (t) => t.replace(/[  ]/g, ' ');

test('la saisie n’accepte que des entiers positifs', () => {
  assert.equal(calcul.normaliserSaisie('12 345'), '12345');
  assert.equal(calcul.normaliserSaisie('-500'), '500');
  assert.equal(calcul.normaliserSaisie('1500,75'), '150075');
  assert.equal(calcul.normaliserSaisie('abc'), '');
  assert.equal(calcul.normaliserSaisie('007'), '7');
  assert.equal(calcul.normaliserSaisie(''), '');
});

test('le plafond de ligne borne la faute de frappe', () => {
  assert.equal(calcul.normaliserSaisie('999999999999'), '1000000000');
});

test('une ligne vide n’est pas comptée', () => {
  const r = calcul.calculer({ 'ex-01': 1000, 'ex-02': 0 }, bareme);
  assert.equal(r.nbLaboratoires, 1);
  assert.equal(r.totalCommandes, 1000);
});

test('un 0 saisi ne compte pas dans le minimum de laboratoires', () => {
  const r = calcul.calculer(
    { 'ex-01': 500000, 'ex-02': 500000, 'ex-03': 0, 'ex-04': 0, 'ex-05': 0 },
    bareme
  );
  assert.equal(r.nbLaboratoires, 2);
  assert.equal(calcul.evaluerConditions(r).laboratoiresManquants, 3);
});

test('aucun arrondi intermédiaire : la somme est exacte avant arrondi', () => {
  // Chaque ligne prise seule s’arrondirait à 0 ; leur somme vaut 1.
  const montants = { 'ex-02': 16, 'ex-05': 27, 'ex-08': 33 };
  const r = calcul.calculer(montants, bareme);
  const arrondiParLigne =
    Math.round(16 * 0.025) + Math.round(27 * 0.015) + Math.round(33 * 0.012);
  assert.equal(arrondiParLigne, 0);
  assert.equal(r.remiseAffichee, 1);
});

test('le total des commandes est exact', () => {
  const r = calcul.calculer({ 'ex-01': 123456, 'ex-04': 654321 }, bareme);
  assert.equal(r.totalCommandes, 777777);
});

test('la remise suit montant × taux, sommé sur les lignes', () => {
  const r = calcul.calculer({ 'ex-01': 1000000, 'ex-04': 1000000 }, bareme);
  assert.equal(r.remiseAffichee, 30000 + 42000);
});

test('le taux moyen s’affiche avec une décimale', () => {
  const r = calcul.calculer({ 'ex-01': 1000000, 'ex-05': 1000000 }, bareme);
  // (0,030 + 0,015) / 2 = 2,25 % -> 2,3 %
  assert.equal(espaces(calcul.formaterTaux(r.tauxMoyen)), '2,3 %');
});

test('le taux moyen d’une saisie vide ne divise pas par zéro', () => {
  const r = calcul.calculer({}, bareme);
  assert.equal(r.tauxMoyen, 0);
  assert.equal(r.remiseAffichee, 0);
});

test('conditions d’accès : 4 laboratoires pour 1 000 000 DA bloquent', () => {
  const r = calcul.calculer(
    { 'ex-01': 250000, 'ex-02': 250000, 'ex-03': 250000, 'ex-04': 250000 },
    bareme
  );
  const c = calcul.evaluerConditions(r);
  assert.equal(c.accessible, false);
  assert.equal(c.laboratoiresManquants, 1);
  assert.equal(c.montantManquant, 0);
  assert.equal(espaces(calcul.decrireManque(c)), 'Il manque un laboratoire.');
});

test('conditions d’accès : 5 laboratoires pour 999 999 DA bloquent', () => {
  const r = calcul.calculer(
    { 'ex-01': 200000, 'ex-02': 200000, 'ex-03': 200000, 'ex-04': 200000, 'ex-05': 199999 },
    bareme
  );
  const c = calcul.evaluerConditions(r);
  assert.equal(c.accessible, false);
  assert.equal(c.laboratoiresManquants, 0);
  assert.equal(c.montantManquant, 1);
  assert.equal(espaces(calcul.decrireManque(c)), 'Il manque 1 DA.');
});

test('conditions d’accès : cas passant', () => {
  const r = calcul.calculer(
    { 'ex-01': 200000, 'ex-02': 200000, 'ex-03': 200000, 'ex-04': 200000, 'ex-05': 200000 },
    bareme
  );
  assert.equal(calcul.evaluerConditions(r).accessible, true);
  assert.equal(calcul.decrireManque(calcul.evaluerConditions(r)), '');
});

test('le manque cumule laboratoires et montant', () => {
  const r = calcul.calculer({ 'ex-01': 700000, 'ex-02': 100000 }, bareme);
  const c = calcul.evaluerConditions(r);
  assert.equal(espaces(calcul.decrireManque(c)), 'Il manque 3 laboratoires et 200 000 DA.');
});

test('le récapitulatif ne porte ni taux ni remise par ligne', () => {
  const r = calcul.calculer({ 'ex-01': 1000000 }, bareme);
  assert.deepEqual(Object.keys(r.lignes[0]).sort(), ['id', 'montant', 'nom']);
});

test('les montants sont formatés en dinars entiers', () => {
  assert.equal(espaces(calcul.formaterMontant(1000000)), '1 000 000 DA');
  assert.equal(espaces(calcul.formaterMontant(0)), '0 DA');
});

test('le formateur d’entier ne porte pas d’unité', () => {
  assert.equal(espaces(calcul.formaterEntier(1000000)), '1 000 000');
  assert.equal(calcul.formaterEntier(0), '0');
});

test('une saisie déjà formatée se relit sans dérive', () => {
  const affiche = calcul.formaterEntier(1234567);
  assert.equal(calcul.normaliserSaisie(affiche), '1234567');
});
