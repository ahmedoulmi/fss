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

/* Identité déclarée par le pharmacien : exigée depuis que les simulations
   sont enregistrées (SPEC § 1, révisé). */
const IDENTITE = { nom: 'Benali', prenom: 'Ahmed', telephone: '0555123456' };


const saisieValide = {
  'ex-01': 1000000, 'ex-02': 800000, 'ex-03': 600000,
  'ex-04': 400000, 'ex-05': 200000
};

function fichierTemporaire() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'massar-')), 'jetons.json');
}

test('un jeton consommé le reste après redémarrage', async () => {
  const chemin = fichierTemporaire();
  const jeton = nouveauJeton();

  const avant = creerDepotFichier(chemin);
  avant.creer(jeton, {});
  const noyauAvant = creerNoyau({ bareme, depot: avant });
  assert.equal((await noyauAvant.simuler(jeton, saisieValide, IDENTITE)).statut, STATUTS.OK);

  // Nouveau processus : le dépôt est relu depuis le fichier.
  const apres = creerDepotFichier(chemin);
  const noyauApres = creerNoyau({ bareme, depot: apres });
  assert.equal((await noyauApres.simuler(jeton, saisieValide, IDENTITE)).statut, STATUTS.JETON_CONSOMME);
});

test('un jeton non consommé survit au redémarrage', async () => {
  const chemin = fichierTemporaire();
  const jeton = nouveauJeton();
  creerDepotFichier(chemin).creer(jeton, {});

  const noyau = creerNoyau({ bareme, depot: creerDepotFichier(chemin) });
  assert.equal((await noyau.simuler(jeton, saisieValide, IDENTITE)).statut, STATUTS.OK);
});

test('un lien jamais utilisé finit par expirer', async () => {
  const chemin = fichierTemporaire();
  const depot = creerDepotFichier(chemin);
  const jeton = nouveauJeton();
  const echeance = new Date('2026-03-01T00:00:00Z').toISOString();
  depot.creer(jeton, { expireLe: echeance });

  const avant = creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2026-02-28T00:00:00Z')
  });
  assert.equal((await avant.laboratoiresPour(jeton)).statut, STATUTS.OK);

  const apres = creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2026-03-02T00:00:00Z')
  });
  assert.equal((await apres.laboratoiresPour(jeton)).statut, STATUTS.JETON_EXPIRE);
  assert.equal((await apres.simuler(jeton, saisieValide, IDENTITE)).statut, STATUTS.JETON_EXPIRE);
});

test('un jeton sans échéance ne périme pas', async () => {
  const depot = creerDepotFichier(fichierTemporaire());
  const jeton = nouveauJeton();
  depot.creer(jeton, {});
  const noyau = creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2099-01-01T00:00:00Z')
  });
  assert.equal((await noyau.laboratoiresPour(jeton)).statut, STATUTS.OK);
});

test('un jeton consommé prime sur son expiration', async () => {
  const depot = creerDepotFichier(fichierTemporaire());
  const jeton = nouveauJeton();
  depot.creer(jeton, { expireLe: new Date('2026-03-01T00:00:00Z').toISOString() });
  // Consommé pendant qu'il était encore valable.
  await creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2026-02-01T00:00:00Z')
  }).simuler(jeton, saisieValide, IDENTITE);

  const tardif = creerNoyau({
    bareme, depot, maintenant: () => Date.parse('2099-01-01T00:00:00Z')
  });
  assert.equal((await tardif.laboratoiresPour(jeton)).statut, STATUTS.JETON_CONSOMME);
});

/*
 * Depuis la révision du § 1, les simulations sont enregistrées. La ligne de
 * jeton, elle, n'a pas changé de nature : elle suit la vie du lien, et ne doit
 * toujours porter ni montant ni remise. Les deux listes sont closes — tout
 * champ nouveau doit être ajouté ici sciemment.
 */
test('la ligne de jeton ne porte toujours ni montant ni remise', async () => {
  const chemin = fichierTemporaire();
  const depot = creerDepotFichier(chemin);
  const jeton = nouveauJeton();
  depot.creer(jeton, { officine: 'Pharmacie du Centre' });
  await creerNoyau({ bareme, depot }).simuler(jeton, saisieValide, IDENTITE);

  assert.deepEqual(
    Object.keys(JSON.parse(fs.readFileSync(chemin, 'utf8')).jetons[jeton]).sort(),
    ['consommeLe', 'creeLe', 'expireLe', 'officine', 'supprimeLe']
  );
});

test('la simulation enregistrée porte exactement ce qui a été demandé', async () => {
  const chemin = fichierTemporaire();
  const depot = creerDepotFichier(chemin);
  const jeton = nouveauJeton();
  depot.creer(jeton, { officine: 'lien émis pour Ahmed' });
  const reponse = await creerNoyau({ bareme, depot })
    .simuler(jeton, saisieValide, IDENTITE);
  assert.equal(reponse.statut, STATUTS.OK);

  const enregistree = JSON.parse(fs.readFileSync(chemin, 'utf8')).simulations[jeton];
  assert.deepEqual(Object.keys(enregistree).sort(), [
    'detail', 'jeton', 'nbLaboratoires', 'nom', 'prenom', 'remise',
    'simuleLe', 'tauxMoyen', 'telephone', 'total'
  ]);

  // Le nom retenu est celui que le pharmacien déclare, pas l'étiquette du
  // lien — celle-ci se rapproche à la lecture, sans être recopiée.
  assert.equal(enregistree.nom, 'Benali');
  assert.equal(enregistree.prenom, 'Ahmed');
  assert.equal(enregistree.telephone, '0555123456');
  assert.equal(enregistree.total, 3000000);
  assert.equal(enregistree.nbLaboratoires, 5);
  assert.equal(enregistree.remise, reponse.resultat.remise);

  // Détail par laboratoire : identifiant, nom, montant saisi. Aucun taux, et
  // aucune remise par ligne — les rapporter reviendrait à écrire le barème.
  assert.equal(enregistree.detail.length, 5);
  assert.deepEqual(Object.keys(enregistree.detail[0]).sort(),
    ['id', 'montant', 'nom']);
  assert.equal(
    enregistree.detail.reduce((somme, l) => somme + l.montant, 0),
    enregistree.total
  );
});

test('une simulation refusée n’enregistre rien', async () => {
  const chemin = fichierTemporaire();
  const depot = creerDepotFichier(chemin);
  const jeton = nouveauJeton();
  depot.creer(jeton, { officine: 'Pharmacie du Centre' });

  // Sans téléphone exploitable, le jeton doit rester vivant et rien être écrit.
  const refus = await creerNoyau({ bareme, depot })
    .simuler(jeton, saisieValide, { nom: 'Benali', prenom: 'Ahmed', telephone: '12' });
  assert.equal(refus.statut, STATUTS.IDENTITE_INVALIDE);

  const contenu = JSON.parse(fs.readFileSync(chemin, 'utf8'));
  assert.equal(Object.keys(contenu.simulations || {}).length, 0);
  assert.equal(contenu.jetons[jeton].consommeLe, null);
});

test('une suppression survit au redémarrage', async () => {
  const chemin = fichierTemporaire();
  const jeton = nouveauJeton();

  let depot = creerDepotFichier(chemin);
  depot.creer(jeton, { officine: 'Pharmacie A', expireLe: null });
  assert.equal(depot.supprimer(jeton), true);

  depot = creerDepotFichier(chemin);
  assert.equal(depot.lister(50).length, 0);
  assert.equal(depot.supprimer(jeton), false);

  const noyau = creerNoyau({ bareme, depot });
  assert.equal(await noyau.etatJeton(jeton), STATUTS.JETON_INCONNU);
  assert.equal((await noyau.simuler(jeton, saisieValide, IDENTITE)).statut, STATUTS.JETON_INCONNU);
});

test('un lien supprimé pèse encore sur le plafond après redémarrage', async () => {
  const chemin = fichierTemporaire();
  const jeton = nouveauJeton();

  let depot = creerDepotFichier(chemin);
  depot.creer(jeton, { officine: 'Pharmacie A', expireLe: null });
  depot.supprimer(jeton);

  depot = creerDepotFichier(chemin);
  const noyau = creerNoyau({ bareme, depot });
  const r = await noyau.emettreLien({ jeton: nouveauJeton(), plafondQuotidien: 1 });
  assert.equal(r.statut, STATUTS.PLAFOND_ATTEINT);
});


test('la simulation lue porte le libellé du lien, sans l’avoir recopié', async () => {
  const chemin = fichierTemporaire();
  const depot = creerDepotFichier(chemin);
  const noyau = creerNoyau({ bareme, depot });
  const jeton = nouveauJeton();
  depot.creer(jeton, { officine: 'Pharmacie du Centre' });

  await noyau.simuler(jeton, saisieValide, IDENTITE);

  const [lue] = await noyau.listerSimulations(10);
  assert.equal(lue.lien, 'Pharmacie du Centre');
  assert.equal(lue.nom, 'Benali');

  // Le libellé n'est pas dans la ligne enregistrée : il vient de la ligne de
  // jeton. Une seule vérité, donc rien à resynchroniser.
  const brut = JSON.parse(fs.readFileSync(chemin, 'utf8')).simulations[jeton];
  assert.equal(brut.lien, undefined);
});
