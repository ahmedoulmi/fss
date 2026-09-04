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
  assert.equal(calcul.normaliserSaisie('1500,75'), '1500');
  assert.equal(calcul.normaliserSaisie('abc'), '');
  assert.equal(calcul.normaliserSaisie('007'), '7');
  assert.equal(calcul.normaliserSaisie(''), '');
});

test('le plafond de ligne borne la faute de frappe', () => {
  assert.equal(calcul.normaliserSaisie('999999999999'), '50000000');
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

test('les décimales sont coupées, pas recollées', () => {
  assert.equal(calcul.normaliserSaisie('800000,99'), '800000');
  assert.equal(calcul.normaliserSaisie('1500.75'), '1500');
  assert.equal(calcul.normaliserSaisie(',99'), '');
});

test('le taux affiché est la division des deux montants affichés', () => {
  // Un pharmacien qui refait « remise ÷ total » doit retrouver le taux
  // exactement, sinon la page se contredit sous ses yeux.
  const bareme = require('../bareme/bareme.exemple.js');
  const cas = [
    { 'ex-01': 1000000, 'ex-02': 800000, 'ex-03': 600000, 'ex-04': 400000, 'ex-05': 200000 },
    { 'ex-01': 3333333, 'ex-03': 1777777, 'ex-06': 999999, 'ex-08': 123457, 'ex-10': 7654321 },
    { 'ex-02': 1, 'ex-04': 2, 'ex-05': 3, 'ex-07': 5, 'ex-09': 8 }
  ];
  cas.forEach((montants) => {
    const r = calcul.calculer(montants, bareme);
    const refait = (r.remiseAffichee / r.totalCommandes) * 100;
    assert.equal(calcul.formaterTaux(r.tauxMoyen), calcul.formaterTaux(refait));
  });
});

/* ── Plafond par laboratoire, et moyenne mensuelle ────────────────────── */

test('le plafond borne le laboratoire, jamais le total', () => {
  const plafond = calcul.CONSTANTES.PLAFOND_LIGNE;
  assert.equal(plafond, 50000000);

  // Une saisie au-delà du plafond y est ramenée.
  assert.equal(calcul.montantDepuisSaisie('50000001'), plafond);
  assert.equal(calcul.montantDepuisSaisie('999999999'), plafond);
  // En deçà, elle passe telle quelle.
  assert.equal(calcul.montantDepuisSaisie('49999999'), 49999999);

  // Le total, lui, est une somme : trente lignes au plafond le dépassent
  // largement, et c'est légitime.
  const laboratoires = [];
  const montants = {};
  for (let i = 0; i < 30; i += 1) {
    laboratoires.push({ id: 'l' + i, nom: 'L' + i });
    montants['l' + i] = plafond;
  }
  const totaux = calcul.calculerTotaux(montants, laboratoires);
  assert.equal(totaux.totalCommandes, 30 * plafond);
  assert.equal(totaux.totalCommandes, 1500000000);
});

test('la moyenne mensuelle est le douzième du total', () => {
  assert.equal(calcul.moyenneMensuelle(12000000), 1000000);
  assert.equal(calcul.moyenneMensuelle(0), 0);
  // Arrondi à l'entier, comme tout montant affiché.
  assert.equal(calcul.moyenneMensuelle(100), 8);
  assert.equal(calcul.moyenneMensuelle(1000000), 83333);
  // Une entrée qui n'est pas un nombre ne produit pas NaN à l'écran.
  assert.equal(calcul.moyenneMensuelle(undefined), 0);
  assert.equal(calcul.moyenneMensuelle('12000000'), 0);
  assert.equal(calcul.moyenneMensuelle(Infinity), 0);
});

/* ── Identité déclarée par le pharmacien ──────────────────────────────── */

test('un mobile algérien est reconnu sous ses formes usuelles', () => {
  ['0555123456', '0555 12 34 56', '05.55.12.34.56',
   '+213555123456', '+213 555 12 34 56', '00213555123456']
    .forEach((forme) => {
      assert.equal(calcul.normaliserTelephone(forme), '0555123456', forme);
    });

  // Les quatre préfixes retenus.
  ['05', '06', '07', '09'].forEach((prefixe) => {
    const numero = prefixe + '55123456';
    assert.equal(calcul.normaliserTelephone(numero), numero, numero);
  });
});

test('un téléphone inexploitable est refusé, jamais rafistolé', () => {
  [
    '', '   ', '12345', 'azerty', '00000',
    '555123456',      // sans le zéro initial
    '055512345',      // neuf chiffres
    '05551234567',    // onze chiffres
    '021456789',      // fixe : écarté, c'est un portable qu'on rappelle
    '0455123456',     // préfixe hors 05, 06, 07, 09
    '0855123456',
    '0155123456'
  ].forEach((forme) => {
    assert.equal(calcul.normaliserTelephone(forme), '', JSON.stringify(forme));
    assert.equal(calcul.telephoneValide(forme), false, JSON.stringify(forme));
  });
});

test('un nom ou un prénom exige deux lettres', () => {
  ['Ali', 'Benali', 'Ph', 'اسم', 'Aït Ahmed']
    .forEach((n) => assert.equal(calcul.nomValide(n), true, n));

  ['', '  ', 'A', 'B.', '12', '...', '1 2 3', 'x'.repeat(41)]
    .forEach((n) => assert.equal(calcul.nomValide(n), false, JSON.stringify(n)));
});

test('le téléphone s’affiche en groupes lisibles', () => {
  assert.equal(calcul.formaterTelephone('0555123456'), '05 55 12 34 56');
  assert.equal(calcul.formaterTelephone('+213 655 12 34 56'), '06 55 12 34 56');
  // Une valeur non normalisable est rendue telle quelle, jamais tronquée.
  assert.equal(calcul.formaterTelephone('inconnu'), 'inconnu');
  assert.equal(calcul.formaterTelephone('021456789'), '021456789');
});
