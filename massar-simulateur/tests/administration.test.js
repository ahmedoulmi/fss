/*
 * Contrôle de la clé d'administration.
 */
const test = require('node:test');
const assert = require('node:assert');

const { creerAdministration, memeCle } = require('../serveur/administration.js');
const { creerNoyau, STATUTS } = require('../serveur/noyau.js');
const creerDepotMemoire = require('../serveur/depot-memoire.js');
const { nouveauJeton } = require('../serveur/jetons.js');
const bareme = require('../bareme/bareme.exemple.js');

/* Identité déclarée par le pharmacien : exigée depuis que les simulations
   sont enregistrées (SPEC § 1, révisé). */
const IDENTITE = { officine: 'Pharmacie du Centre', telephone: '0555123456' };


const CLE = 'cle-de-test-suffisamment-longue-pour-etre-realiste';

function contexte(cleAttendue = CLE) {
  const depot = creerDepotMemoire();
  const noyau = creerNoyau({ bareme, depot });
  return creerAdministration({ noyau, cleAttendue, nouveauJeton });
}

test('la comparaison de clés ne s’arrête pas au premier écart', () => {
  assert.equal(memeCle('abc', 'abc'), true);
  assert.equal(memeCle('abc', 'abd'), false);
  assert.equal(memeCle('abc', 'abcd'), false);
  assert.equal(memeCle('', ''), true);
  assert.equal(memeCle(null, 'abc'), false);
  assert.equal(memeCle('abc', undefined), false);
});

test('sans clé configurée, l’administration reste fermée', async () => {
  const admin = contexte('');
  assert.equal(admin.cleValide(''), false);
  assert.equal(admin.cleValide('nimporte quoi'), false);
  assert.equal((await admin.lister('')).statut, STATUTS.REQUETE_INVALIDE);
});

test('une clé fausse n’émet rien et n’apprend rien', async () => {
  const admin = contexte();
  const r = await admin.emettre('mauvaise-cle', { base: 'https://exemple.test' });
  assert.equal(r.statut, STATUTS.REQUETE_INVALIDE);
  assert.equal(r.lien, undefined);
  assert.equal((await admin.lister('mauvaise-cle')).liens, undefined);
});

test('la bonne clé émet un lien complet', async () => {
  const admin = contexte();
  const r = await admin.emettre(CLE, { officine: 'Pharmacie du Centre', base: 'https://exemple.test/' });
  assert.equal(r.statut, STATUTS.OK);
  assert.match(r.lien, /^https:\/\/exemple\.test\/\?s=[A-Za-z0-9_-]{22}$/);

  const liste = await admin.lister(CLE);
  assert.equal(liste.statut, STATUTS.OK);
  assert.equal(liste.liens[0].officine, 'Pharmacie du Centre');
});

test('le nom d’officine est borné', async () => {
  const admin = contexte();
  await admin.emettre(CLE, { officine: 'x'.repeat(500), base: 'https://exemple.test' });
  assert.equal((await admin.lister(CLE)).liens[0].officine.length, 80);
});

/*
 * Un secret déposé depuis un fichier texte emporte souvent son saut de ligne
 * final ; une clé recopiée à la main, un espace. Ces accidents ne doivent pas
 * fermer la porte — mais rien d'autre ne doit l'ouvrir.
 */
test('les blancs autour d’une clé sont sans effet', async () => {
  const avecSautDeLigne = contexte(CLE + '\n');
  assert.equal((await avecSautDeLigne.lister(CLE)).statut, STATUTS.OK);

  const avecEspaces = contexte('  ' + CLE + '  ');
  assert.equal((await avecEspaces.lister(CLE)).statut, STATUTS.OK);

  const admin = contexte();
  assert.equal((await admin.lister(CLE + '\n')).statut, STATUTS.OK);
  assert.equal((await admin.lister(' ' + CLE)).statut, STATUTS.OK);
});

test('une clé faite de blancs n’ouvre rien', async () => {
  const admin = contexte('   \n  ');
  assert.equal((await admin.lister('   \n  ')).statut, STATUTS.REQUETE_INVALIDE);
  assert.equal((await admin.lister('')).statut, STATUTS.REQUETE_INVALIDE);
});

test('un blanc ne rattrape pas une clé fausse', async () => {
  const admin = contexte();
  assert.equal((await admin.lister(' ' + CLE + 'x ')).statut, STATUTS.REQUETE_INVALIDE);
  assert.equal((await admin.lister(CLE.slice(0, -1) + ' ')).statut, STATUTS.REQUETE_INVALIDE);
});

/* ── Suppression d'un lien ────────────────────────────────────────────── */

async function unLien(admin, officine) {
  const r = await admin.emettre(CLE, { officine, base: 'https://exemple.test' });
  assert.equal(r.statut, STATUTS.OK);
  return r.jeton;
}

test('un lien supprimé quitte la liste', async () => {
  const admin = contexte();
  const jeton = await unLien(admin, 'Pharmacie A');
  await unLien(admin, 'Pharmacie B');
  assert.equal((await admin.lister(CLE)).liens.length, 2);

  assert.equal((await admin.supprimer(CLE, jeton)).statut, STATUTS.OK);

  const restants = (await admin.lister(CLE)).liens;
  assert.equal(restants.length, 1);
  assert.equal(restants[0].officine, 'Pharmacie B');
});

test('un lien supprimé n’ouvre plus rien', async () => {
  const depot = creerDepotMemoire();
  const noyau = creerNoyau({ bareme, depot });
  const admin = creerAdministration({ noyau, cleAttendue: CLE, nouveauJeton });

  const jeton = await unLien(admin, 'Pharmacie A');
  assert.equal(await noyau.etatJeton(jeton), STATUTS.OK);

  await admin.supprimer(CLE, jeton);

  // Indiscernable d'un jeton jamais émis : rien ne fuit sur ce qui a existé.
  assert.equal(await noyau.etatJeton(jeton), STATUTS.JETON_INCONNU);
  assert.equal((await noyau.laboratoiresPour(jeton)).statut, STATUTS.JETON_INCONNU);
  assert.equal((await noyau.simuler(jeton, {}, IDENTITE)).statut, STATUTS.JETON_INCONNU);
});

/*
 * Le point qui compte. Si supprimer libérait une place, qui tient la clé
 * émettrait sans limite en supprimant au fur et à mesure — et le plafond,
 * seul garde-fou contre la déduction du barème, ne servirait plus à rien.
 */
test('supprimer ne libère pas de place sous le plafond', async () => {
  const depot = creerDepotMemoire();
  const noyau = creerNoyau({ bareme, depot });
  const admin = creerAdministration({ noyau, cleAttendue: CLE, nouveauJeton });

  const emis = [];
  for (let i = 0; i < 30; i += 1) emis.push(await unLien(admin, 'P' + i));

  assert.equal(
    (await admin.emettre(CLE, { officine: 'de trop', base: 'https://exemple.test' })).statut,
    STATUTS.PLAFOND_ATTEINT
  );

  for (const jeton of emis) {
    assert.equal((await admin.supprimer(CLE, jeton)).statut, STATUTS.OK);
  }
  assert.equal((await admin.lister(CLE)).liens.length, 0);

  assert.equal(
    (await admin.emettre(CLE, { officine: 'après le ménage', base: 'https://exemple.test' })).statut,
    STATUTS.PLAFOND_ATTEINT
  );
});

test('supprimer deux fois le même lien reste sans effet', async () => {
  const admin = contexte();
  const jeton = await unLien(admin, 'Pharmacie A');
  assert.equal((await admin.supprimer(CLE, jeton)).statut, STATUTS.OK);
  assert.equal((await admin.supprimer(CLE, jeton)).statut, STATUTS.JETON_INCONNU);
});

test('la suppression exige la clé', async () => {
  const admin = contexte();
  const jeton = await unLien(admin, 'Pharmacie A');

  assert.equal((await admin.supprimer('', jeton)).statut, STATUTS.REQUETE_INVALIDE);
  assert.equal((await admin.supprimer(CLE + 'x', jeton)).statut, STATUTS.REQUETE_INVALIDE);
  assert.equal((await admin.lister(CLE)).liens.length, 1);
});

test('un jeton absent ou vide ne fait rien croire', async () => {
  const admin = contexte();
  assert.equal((await admin.supprimer(CLE, '')).statut, STATUTS.REQUETE_INVALIDE);
  assert.equal((await admin.supprimer(CLE, 'jeton-inexistant')).statut, STATUTS.JETON_INCONNU);
});
