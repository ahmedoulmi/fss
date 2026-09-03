#!/usr/bin/env node
/*
 * Mise en ligne du simulateur sur Cloudflare Workers.
 *
 *   node deployer.js /chemin/vers/bareme-secret.json
 *
 * Écrit en Node plutôt qu'en shell : Node est de toute façon nécessaire, et
 * la même commande fonctionne sous Windows, macOS et Linux.
 *
 * Le barème n'est pas dans le dépôt : son chemin est passé en argument, et il
 * n'est écrit nulle part ailleurs que dans le secret Cloudflare.
 *
 * Rejouable : relancé, il ne recrée pas ce qui existe déjà.
 */
'use strict';

var fs = require('node:fs');
var path = require('node:path');
var { spawnSync } = require('node:child_process');

var BASE = __dirname;
var TOML = path.join(BASE, 'wrangler.toml');
var ID_VIERGE = '00000000-0000-0000-0000-000000000000';

function echec(message) {
  console.error('\n  ✗ ' + message + '\n');
  process.exit(1);
}

function etape(titre) {
  console.log('\n── ' + titre);
}

/* `shell: true` pour que npx soit trouvé aussi sous Windows, où c'est npx.cmd. */
function lancer(commande, options) {
  var r = spawnSync(commande, Object.assign({
    cwd: BASE, shell: true, stdio: 'inherit', encoding: 'utf8'
  }, options || {}));
  if (r.error) echec('Impossible de lancer : ' + commande + '\n    ' + r.error.message);
  return r;
}

function capturer(commande) {
  return spawnSync(commande, {
    cwd: BASE, shell: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  });
}

// ── Le barème ──────────────────────────────────────────────────────────
var argument = process.argv[2];
if (!argument) echec('Usage : node deployer.js /chemin/vers/bareme-secret.json');

var cheminBareme = path.resolve(argument);
if (!fs.existsSync(cheminBareme)) echec('Barème introuvable : ' + cheminBareme);

var bareme;
try {
  bareme = JSON.parse(fs.readFileSync(cheminBareme, 'utf8'));
} catch (e) {
  echec('Le fichier n’est pas du JSON lisible : ' + e.message);
}
if (!Array.isArray(bareme.laboratoires) || bareme.laboratoires.length === 0) {
  echec('Le barème ne contient aucun laboratoire.');
}
if (!bareme.dateValidite) echec('Le barème n’a pas de date de validité.');
console.log('  ' + bareme.laboratoires.length + ' laboratoires, conditions au ' +
  bareme.dateValidite);

// ── 1. Le contrôle avant mise en service ───────────────────────────────
etape('1/6  Contrôle avant mise en service');
var controle = lancer('node build/verifier.js', {
  env: Object.assign({}, process.env, { MASSAR_BAREME: cheminBareme })
});
if (controle.status !== 0) {
  echec('Le contrôle refuse la mise en ligne. Corrigez les points ci-dessus.');
}

// ── 2. Wrangler ────────────────────────────────────────────────────────
etape('2/6  Outillage');
if (lancer('npx --yes wrangler --version').status !== 0) {
  echec('wrangler n’a pas répondu. Vérifiez votre connexion internet.');
}

// ── 3. Le compte Cloudflare ────────────────────────────────────────────
etape('3/6  Compte Cloudflare');
if (capturer('npx wrangler whoami').status !== 0) {
  console.log('  Connexion requise — une page va s’ouvrir dans votre navigateur.');
  if (lancer('npx wrangler login').status !== 0) echec('Connexion à Cloudflare échouée.');
}
lancer('npx wrangler whoami');

// ── 4. La base des jetons ──────────────────────────────────────────────
etape('4/6  Base des jetons');
var toml = fs.readFileSync(TOML, 'utf8');
if (toml.indexOf(ID_VIERGE) !== -1) {
  console.log('  Création de la base massar-jetons…');
  var creation = capturer('npx wrangler d1 create massar-jetons');
  var sortie = (creation.stdout || '') + (creation.stderr || '');
  console.log(sortie.trim());
  var trouve = sortie.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  if (!trouve || trouve[0] === ID_VIERGE) {
    echec('Identifiant de base introuvable dans la réponse.\n' +
      '    Reportez-le à la main dans wrangler.toml, puis relancez.');
  }
  fs.writeFileSync(TOML, toml.replace(ID_VIERGE, trouve[0]), 'utf8');
  console.log('  database_id reporté dans wrangler.toml : ' + trouve[0]);
} else {
  console.log('  wrangler.toml porte déjà un identifiant de base — rien à créer.');
}

// ── 5. La table et le barème ───────────────────────────────────────────
etape('5/6  Table et barème');
if (lancer('npx wrangler d1 execute massar-jetons --remote --yes ' +
    '--file serveur/adaptateurs/cloudflare/schema.sql').status !== 0) {
  echec('Création de la table échouée.');
}

console.log('  Dépôt du barème en secret…');
var secret = lancer('npx wrangler secret put BAREME', {
  input: fs.readFileSync(cheminBareme, 'utf8'),
  stdio: ['pipe', 'inherit', 'inherit']
});
if (secret.status !== 0) echec('Dépôt du barème échoué.');

// ── 6. La publication ──────────────────────────────────────────────────
etape('6/6  Publication');
if (lancer('npx wrangler deploy').status !== 0) echec('Publication échouée.');

console.log([
  '',
  '  ✓ En ligne.',
  '',
  '  Émettez trois liens d’essai, avec l’adresse affichée ci-dessus :',
  '',
  '    node serveur/adaptateurs/cloudflare/creer-lien.js 3 \\',
  '      --base https://massar-simulateur.VOTRECOMPTE.workers.dev',
  '',
  '  Chaque lien vaut 3 jours et ne produit qu’un seul résultat.',
  ''
].join('\n'));
