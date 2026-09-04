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

test('la page ne reçoit aucun taux', async () => {
  const { noyau, jeton } = contexte();
  const charge = await noyau.laboratoiresPour(jeton);
  const serialise = JSON.stringify(charge);
  assert.equal(charge.laboratoires.length, bareme.laboratoires.length);
  charge.laboratoires.forEach((labo) => {
    assert.deepEqual(Object.keys(labo).sort(), ['id', 'nom']);
  });
  bareme.laboratoires.forEach((labo) => {
    assert.ok(!serialise.includes(String(labo.taux)), 'un taux a fuité');
  });
});

test('le résultat ne porte que des agrégats', async () => {
  const { noyau, jeton } = contexte();
  const reponse = await noyau.simuler(jeton, saisieValide);
  assert.equal(reponse.statut, STATUTS.OK);
  assert.deepEqual(
    Object.keys(reponse.resultat).sort(),
    ['remise', 'tauxMoyen', 'totalCommandes']
  );
  assert.equal(reponse.resultat.remise, 80600);
  assert.equal(reponse.resultat.totalCommandes, 3000000);
});

test('le jeton ne sert qu’une fois', async () => {
  const { noyau, jeton } = contexte();
  assert.equal((await noyau.simuler(jeton, saisieValide)).statut, STATUTS.OK);
  assert.equal((await noyau.simuler(jeton, saisieValide)).statut, STATUTS.JETON_CONSOMME);
  assert.equal((await noyau.simuler(jeton, saisieValide)).statut, STATUTS.JETON_CONSOMME);
});

test('la déduction par différence est impossible', async () => {
  // Deux simulations ne variant que d'une ligne : la seconde n'aboutit pas.
  const { noyau, jeton } = contexte();
  const premiere = await noyau.simuler(jeton, saisieValide);
  const variante = Object.assign({}, saisieValide, { 'ex-01': 1000001 });
  const seconde = await noyau.simuler(jeton, variante);
  assert.equal(premiere.statut, STATUTS.OK);
  assert.equal(seconde.statut, STATUTS.JETON_CONSOMME);
  assert.equal(seconde.resultat, undefined);
});

test('la liste des laboratoires est fermée aux jetons morts', async () => {
  const { noyau, jeton } = contexte();
  const saisie = { 'ex-01': 1000000, 'ex-02': 800000, 'ex-03': 600000,
                   'ex-04': 400000, 'ex-05': 200000 };
  assert.equal((await noyau.laboratoiresPour(jeton)).statut, STATUTS.OK);
  await noyau.simuler(jeton, saisie);
  const apres = await noyau.laboratoiresPour(jeton);
  assert.equal(apres.statut, STATUTS.JETON_CONSOMME);
  assert.equal(apres.laboratoires, undefined);
  assert.equal((await noyau.laboratoiresPour('inexistant')).statut, STATUTS.JETON_INCONNU);
});

test('lire la liste ne consomme pas le jeton', async () => {
  const { noyau, jeton } = contexte();
  await noyau.laboratoiresPour(jeton);
  await noyau.laboratoiresPour(jeton);
  assert.equal((await noyau.simuler(jeton, saisieValide)).statut, STATUTS.OK);
});

test('un jeton inconnu n’apprend rien', async () => {
  const { noyau } = contexte();
  const reponse = await noyau.simuler(nouveauJeton(), saisieValide);
  assert.equal(reponse.statut, STATUTS.JETON_INCONNU);
  assert.equal(reponse.resultat, undefined);
});

test('les conditions sont revalidées côté serveur', async () => {
  // Une page modifiée qui force l'envoi ne contourne pas le seuil.
  const { noyau, jeton } = contexte();
  const reponse = await noyau.simuler(jeton, { 'ex-01': 1000000 });
  assert.equal(reponse.statut, STATUTS.CONDITIONS);
  assert.equal(reponse.conditions.laboratoiresManquants, 4);
  assert.equal(reponse.resultat, undefined);
});

test('une requête refusée ne consomme pas le jeton', async () => {
  const { noyau, jeton } = contexte();
  assert.equal((await noyau.simuler(jeton, { 'ex-01': 1000 })).statut, STATUTS.CONDITIONS);
  assert.equal((await noyau.simuler(jeton, saisieValide)).statut, STATUTS.OK);
});

test('les montants envoyés sont réassainis', async () => {
  const { noyau, jeton } = contexte();
  // Montant formaté, décimales, et un laboratoire hors barème.
  const reponse = await noyau.simuler(jeton, {
    'ex-01': '1 000 000', 'ex-02': '800000,99', 'ex-03': '600000',
    'ex-04': 400000, 'ex-05': '200000', 'inconnu': 9999999
  });
  assert.equal(reponse.statut, STATUTS.OK);
  assert.equal(reponse.resultat.totalCommandes, 3000000);
});

test('un montant négatif ou décimal est écarté, jamais réinterprété', async () => {
  const { noyau, jeton } = contexte();
  const reponse = await noyau.simuler(jeton, {
    'ex-01': 1000000, 'ex-02': 800000, 'ex-03': 600000,
    'ex-04': 400000, 'ex-05': 200000,
    'ex-06': -500000,   // écarté, et non transformé en +500 000
    'ex-07': 1500.75,   // écarté, et non arrondi
    'ex-08': Infinity   // écarté
  });
  assert.equal(reponse.statut, STATUTS.OK);
  assert.equal(reponse.resultat.totalCommandes, 3000000);
});

test('le plafond de ligne s’applique aussi à un envoi direct', async () => {
  const { noyau, jeton } = contexte();
  const reponse = await noyau.simuler(jeton, {
    'ex-01': 999999999999, 'ex-02': 800000, 'ex-03': 600000,
    'ex-04': 400000, 'ex-05': 200000
  });
  assert.equal(reponse.statut, STATUTS.OK);
  assert.equal(reponse.resultat.totalCommandes, 1000000000 + 2000000);
});

test('une requête sans jeton est rejetée', async () => {
  const { noyau } = contexte();
  assert.equal((await noyau.simuler('', saisieValide)).statut, STATUTS.REQUETE_INVALIDE);
  assert.equal((await noyau.simuler(null, saisieValide)).statut, STATUTS.REQUETE_INVALIDE);
});

test('le journal ne retient ni montants ni remise', async () => {
  const { noyau, depot, jeton } = contexte();
  await noyau.simuler(jeton, saisieValide);
  const lignes = depot.journal();
  assert.equal(lignes.length, 1);
  assert.deepEqual(Object.keys(lignes[0]).sort(), ['consommeLe', 'creeLe', 'jeton']);
  assert.notEqual(lignes[0].consommeLe, null);
});

test('deux jetons sont indépendants', async () => {
  const { noyau, depot, jeton } = contexte();
  const second = nouveauJeton();
  depot.creer(second, {});
  assert.equal((await noyau.simuler(jeton, saisieValide)).statut, STATUTS.OK);
  assert.equal((await noyau.simuler(second, saisieValide)).statut, STATUTS.OK);
});

test('un lien émis est en attente, puis utilisé', async () => {
  const { noyau, depot } = contexte();
  const emis = await noyau.emettreLien({ jeton: nouveauJeton(), officine: 'Pharmacie A' });
  assert.equal(emis.statut, STATUTS.OK);

  let liens = await noyau.listerLiens();
  const ligne = liens.find((l) => l.jeton === emis.jeton);
  assert.equal(ligne.etat, 'en-attente');
  assert.equal(ligne.officine, 'Pharmacie A');

  await noyau.simuler(emis.jeton, saisieValide);
  liens = await noyau.listerLiens();
  assert.equal(liens.find((l) => l.jeton === emis.jeton).etat, 'utilise');
});

test('le plafond quotidien borne l’émission', async () => {
  // Le décor crée déjà un jeton : le plafond compte tout ce qui existe.
  const { noyau } = contexte();
  for (let i = 0; i < 4; i++) {
    assert.equal(
      (await noyau.emettreLien({ jeton: nouveauJeton(), plafondQuotidien: 5 })).statut,
      STATUTS.OK, 'émission ' + (i + 1)
    );
  }
  const refuse = await noyau.emettreLien({ jeton: nouveauJeton(), plafondQuotidien: 5 });
  assert.equal(refuse.statut, STATUTS.PLAFOND_ATTEINT);
  assert.equal(refuse.jeton, undefined);
  // Et le refus n'a rien écrit.
  assert.equal((await noyau.listerLiens()).length, 5);
});

test('la liste des liens ne porte ni montant ni remise', async () => {
  const { noyau } = contexte();
  const emis = await noyau.emettreLien({ jeton: nouveauJeton() });
  await noyau.simuler(emis.jeton, saisieValide);
  const ligne = (await noyau.listerLiens())[0];
  assert.deepEqual(Object.keys(ligne).sort(),
    ['consommeLe', 'creeLe', 'etat', 'expireLe', 'jeton', 'officine']);
});
