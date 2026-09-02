/*
 * Cycle de vie du jeton et étanchéité du barème (PLAN §3, option C).
 */
const test = require('node:test');
const assert = require('node:assert');

const { creerNoyau, STATUTS } = require('../serveur/noyau.js');
const creerDepotMemoire = require('../serveur/depot-memoire.js');
const { nouveauJeton } = require('../serveur/jetons.js');
const bareme = require('../bareme/bareme.exemple.js');

function contexte() {
  const depot = creerDepotMemoire();
  const noyau = creerNoyau({ bareme, depot });
  const jeton = nouveauJeton();
  depot.creer(jeton, { officine: 'Pharmacie du Centre' });
  return { depot, noyau, jeton };
}

const saisieValide = {
  'ex-01': 1000000, 'ex-02': 800000, 'ex-03': 600000,
  'ex-04': 400000, 'ex-05': 200000
};

test('la page ne reçoit aucun taux', () => {
  const { noyau, jeton } = contexte();
  const charge = noyau.laboratoiresPour(jeton);
  const serialise = JSON.stringify(charge);
  assert.equal(charge.laboratoires.length, bareme.laboratoires.length);
  charge.laboratoires.forEach((labo) => {
    assert.deepEqual(Object.keys(labo).sort(), ['id', 'nom']);
  });
  bareme.laboratoires.forEach((labo) => {
    assert.ok(!serialise.includes(String(labo.taux)), 'un taux a fuité');
  });
});

test('le résultat ne porte que des agrégats', () => {
  const { noyau, jeton } = contexte();
  const reponse = noyau.simuler(jeton, saisieValide);
  assert.equal(reponse.statut, STATUTS.OK);
  assert.deepEqual(
    Object.keys(reponse.resultat).sort(),
    ['remise', 'tauxMoyen', 'totalCommandes']
  );
  assert.equal(reponse.resultat.remise, 80600);
  assert.equal(reponse.resultat.totalCommandes, 3000000);
});

test('le jeton ne sert qu’une fois', () => {
  const { noyau, jeton } = contexte();
  assert.equal(noyau.simuler(jeton, saisieValide).statut, STATUTS.OK);
  assert.equal(noyau.simuler(jeton, saisieValide).statut, STATUTS.JETON_CONSOMME);
  assert.equal(noyau.simuler(jeton, saisieValide).statut, STATUTS.JETON_CONSOMME);
});

test('la déduction par différence est impossible', () => {
  // Deux simulations ne variant que d'une ligne : la seconde n'aboutit pas.
  const { noyau, jeton } = contexte();
  const premiere = noyau.simuler(jeton, saisieValide);
  const variante = Object.assign({}, saisieValide, { 'ex-01': 1000001 });
  const seconde = noyau.simuler(jeton, variante);
  assert.equal(premiere.statut, STATUTS.OK);
  assert.equal(seconde.statut, STATUTS.JETON_CONSOMME);
  assert.equal(seconde.resultat, undefined);
});

test('la liste des laboratoires est fermée aux jetons morts', () => {
  const { noyau, jeton } = contexte();
  const saisie = { 'ex-01': 1000000, 'ex-02': 800000, 'ex-03': 600000,
                   'ex-04': 400000, 'ex-05': 200000 };
  assert.equal(noyau.laboratoiresPour(jeton).statut, STATUTS.OK);
  noyau.simuler(jeton, saisie);
  const apres = noyau.laboratoiresPour(jeton);
  assert.equal(apres.statut, STATUTS.JETON_CONSOMME);
  assert.equal(apres.laboratoires, undefined);
  assert.equal(noyau.laboratoiresPour('inexistant').statut, STATUTS.JETON_INCONNU);
});

test('lire la liste ne consomme pas le jeton', () => {
  const { noyau, jeton } = contexte();
  noyau.laboratoiresPour(jeton);
  noyau.laboratoiresPour(jeton);
  assert.equal(noyau.simuler(jeton, saisieValide).statut, STATUTS.OK);
});

test('un jeton inconnu n’apprend rien', () => {
  const { noyau } = contexte();
  const reponse = noyau.simuler(nouveauJeton(), saisieValide);
  assert.equal(reponse.statut, STATUTS.JETON_INCONNU);
  assert.equal(reponse.resultat, undefined);
});

test('les conditions sont revalidées côté serveur', () => {
  // Une page modifiée qui force l'envoi ne contourne pas le seuil.
  const { noyau, jeton } = contexte();
  const reponse = noyau.simuler(jeton, { 'ex-01': 1000000 });
  assert.equal(reponse.statut, STATUTS.CONDITIONS);
  assert.equal(reponse.conditions.laboratoiresManquants, 4);
  assert.equal(reponse.resultat, undefined);
});

test('une requête refusée ne consomme pas le jeton', () => {
  const { noyau, jeton } = contexte();
  assert.equal(noyau.simuler(jeton, { 'ex-01': 1000 }).statut, STATUTS.CONDITIONS);
  assert.equal(noyau.simuler(jeton, saisieValide).statut, STATUTS.OK);
});

test('les montants envoyés sont réassainis', () => {
  const { noyau, jeton } = contexte();
  // Montant formaté, décimales, et un laboratoire hors barème.
  const reponse = noyau.simuler(jeton, {
    'ex-01': '1 000 000', 'ex-02': '800000,99', 'ex-03': '600000',
    'ex-04': 400000, 'ex-05': '200000', 'inconnu': 9999999
  });
  assert.equal(reponse.statut, STATUTS.OK);
  assert.equal(reponse.resultat.totalCommandes, 3000000);
});

test('un montant négatif ou décimal est écarté, jamais réinterprété', () => {
  const { noyau, jeton } = contexte();
  const reponse = noyau.simuler(jeton, {
    'ex-01': 1000000, 'ex-02': 800000, 'ex-03': 600000,
    'ex-04': 400000, 'ex-05': 200000,
    'ex-06': -500000,   // écarté, et non transformé en +500 000
    'ex-07': 1500.75,   // écarté, et non arrondi
    'ex-08': Infinity   // écarté
  });
  assert.equal(reponse.statut, STATUTS.OK);
  assert.equal(reponse.resultat.totalCommandes, 3000000);
});

test('le plafond de ligne s’applique aussi à un envoi direct', () => {
  const { noyau, jeton } = contexte();
  const reponse = noyau.simuler(jeton, {
    'ex-01': 999999999999, 'ex-02': 800000, 'ex-03': 600000,
    'ex-04': 400000, 'ex-05': 200000
  });
  assert.equal(reponse.statut, STATUTS.OK);
  assert.equal(reponse.resultat.totalCommandes, 1000000000 + 2000000);
});

test('une requête sans jeton est rejetée', () => {
  const { noyau } = contexte();
  assert.equal(noyau.simuler('', saisieValide).statut, STATUTS.REQUETE_INVALIDE);
  assert.equal(noyau.simuler(null, saisieValide).statut, STATUTS.REQUETE_INVALIDE);
});

test('le journal ne retient ni montants ni remise', () => {
  const { noyau, depot, jeton } = contexte();
  noyau.simuler(jeton, saisieValide);
  const lignes = depot.journal();
  assert.equal(lignes.length, 1);
  assert.deepEqual(Object.keys(lignes[0]).sort(), ['consommeLe', 'creeLe', 'jeton']);
  assert.notEqual(lignes[0].consommeLe, null);
});

test('deux jetons sont indépendants', () => {
  const { noyau, depot, jeton } = contexte();
  const second = nouveauJeton();
  depot.creer(second, {});
  assert.equal(noyau.simuler(jeton, saisieValide).statut, STATUTS.OK);
  assert.equal(noyau.simuler(second, saisieValide).statut, STATUTS.OK);
});
