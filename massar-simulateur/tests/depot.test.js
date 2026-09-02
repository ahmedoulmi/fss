/*
 * Dépôt durable et expiration des liens.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const creerDepotFichier = require('../serveur/depot-fichier.js');
const { creerNoyau, STATUTS } = require('../serveur/noyau.js');
const { nouveauJeton } = require('../serveur/jetons.js');
const bareme = require('../bareme/bareme.exemple.js');

const saisieValide = {
  'ex-01': 1000000, 'ex-02': 800000, 'ex-03': 600000,
  'ex-04': 400000, 'ex-05': 200000
};

function fichierTemporaire() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'massar-')), 'jetons.json');
}

test('un jeton consommé le reste après redémarrage', () => {
  const chemin = fichierTemporaire();
  const jeton = nouveauJeton();

  const avant = creerDepotFichier(chemin);
  avant.creer(jeton, {});
  const noyauAvant = creerNoyau({ bareme, depot: avant });
  assert.equal(noyauAvant.simuler(jeton, saisieValide).statut, STATUTS.OK);

  // Nouveau processus : le dépôt est relu depuis le fichier.
  const apres = creerDepotFichier(chemin);
  const noyauApres = creerNoyau({ bareme, depot: apres });
  assert.equal(noyauApres.simuler(jeton, saisieValide).statut, STATUTS.JETON_CONSOMME);
});

test('un jeton non consommé survit au redémarrage', () => {
  const chemin = fichierTemporaire();
  const jeton = nouveauJeton();
  creerDepotFichier(chemin).creer(jeton, {});

  const noyau = creerNoyau({ bareme, depot: creerDepotFichier(chemin) });
  assert.equal(noyau.simuler(jeton, saisieValide).statut, STATUTS.OK);
});

test('un lien jamais utilisé finit par expirer', () => {
  const chemin = fichierTemporaire();
  const depot = creerDepotFichier(chemin);
  const jeton = nouveauJeton();
  const echeance = new Date('2026-03-01T00:00:00Z').toISOString();
  depot.creer(jeton, { expireLe: echeance });

  const avant = creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2026-02-28T00:00:00Z')
  });
  assert.equal(avant.laboratoiresPour(jeton).statut, STATUTS.OK);

  const apres = creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2026-03-02T00:00:00Z')
  });
  assert.equal(apres.laboratoiresPour(jeton).statut, STATUTS.JETON_EXPIRE);
  assert.equal(apres.simuler(jeton, saisieValide).statut, STATUTS.JETON_EXPIRE);
});

test('un jeton sans échéance ne périme pas', () => {
  const depot = creerDepotFichier(fichierTemporaire());
  const jeton = nouveauJeton();
  depot.creer(jeton, {});
  const noyau = creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2099-01-01T00:00:00Z')
  });
  assert.equal(noyau.laboratoiresPour(jeton).statut, STATUTS.OK);
});

test('un jeton consommé prime sur son expiration', () => {
  const depot = creerDepotFichier(fichierTemporaire());
  const jeton = nouveauJeton();
  depot.creer(jeton, { expireLe: new Date('2026-03-01T00:00:00Z').toISOString() });
  // Consommé pendant qu'il était encore valable.
  creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2026-02-01T00:00:00Z')
  }).simuler(jeton, saisieValide);

  const tardif = creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2099-01-01T00:00:00Z')
  });
  assert.equal(tardif.laboratoiresPour(jeton).statut, STATUTS.JETON_CONSOMME);
});

test('le fichier de dépôt ne retient ni montants ni remise', () => {
  const chemin = fichierTemporaire();
  const depot = creerDepotFichier(chemin);
  const jeton = nouveauJeton();
  depot.creer(jeton, { officine: 'Pharmacie du Centre' });
  creerNoyau({ bareme, depot }).simuler(jeton, saisieValide);

  const contenu = fs.readFileSync(chemin, 'utf8');
  assert.ok(!contenu.includes('1000000'), 'un montant a été conservé');
  assert.ok(!contenu.includes('80600'), 'la remise a été conservée');
  assert.deepEqual(
    Object.keys(JSON.parse(contenu)[jeton]).sort(),
    ['consommeLe', 'creeLe', 'expireLe', 'officine']
  );
});
