/*
 * Génération des jetons de simulation.
 * 16 octets tirés au sort : un lien ne se devine pas et ne s'énumère pas.
 */
var crypto = require('node:crypto');

function nouveauJeton() {
  return crypto.randomBytes(16).toString('base64url');
}

module.exports = { nouveauJeton: nouveauJeton };
