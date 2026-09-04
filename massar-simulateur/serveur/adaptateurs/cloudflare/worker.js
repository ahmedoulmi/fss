/*
 * MASSAR — Adaptateur Cloudflare Workers.
 *
 * Seule couche liée à l'hébergement : le noyau, le calcul et le cycle de vie
 * du jeton sont partagés avec la version Node, sans une ligne de différence.
 *
 * Le barème est lu dans une variable secrète, jamais dans le dépôt de code et
 * jamais dans ce qui est servi au navigateur.
 */
import noyauModule from '../../noyau.js';
import administrationModule from '../../administration.js';
import { creerDepotD1 } from './depot-d1.js';

const { creerNoyau } = noyauModule;
const { creerAdministration } = administrationModule;

/* 16 octets tirés au sort : un lien ne se devine pas et ne s'énumère pas. */
function nouveauJeton() {
  const octets = new Uint8Array(16);
  crypto.getRandomValues(octets);
  let binaire = '';
  octets.forEach((o) => { binaire += String.fromCharCode(o); });
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let bareme = null;

function chargerBareme(env) {
  if (bareme) return bareme;
  if (!env.BAREME) throw new Error('BAREME absent — le secret n’est pas défini.');
  bareme = JSON.parse(env.BAREME);
  return bareme;
}

function json(charge, code = 200) {
  return new Response(JSON.stringify(charge), {
    status: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default {
  async fetch(requete, env) {
    const adresse = new URL(requete.url);

    if (!adresse.pathname.startsWith('/api/')) {
      // Tout le reste est un fichier statique : page, styles, scripts.
      return env.ASSETS.fetch(requete);
    }

    let noyau;
    try {
      noyau = creerNoyau({
        bareme: chargerBareme(env),
        depot: creerDepotD1(env.JETONS)
      });
    } catch (e) {
      return json({ statut: 'erreur' }, 500);
    }

    try {
      if (adresse.pathname === '/api/laboratoires') {
        return json(await noyau.laboratoiresPour(adresse.searchParams.get('s') || ''));
      }

      if (adresse.pathname === '/api/admin/liens') {
        const administration = creerAdministration({
          noyau,
          cleAttendue: env.CLE_ADMIN || '',
          nouveauJeton
        });

        if (requete.method === 'GET') {
          return json(await administration.lister(adresse.searchParams.get('k')));
        }
        if (requete.method === 'DELETE') {
          return json(await administration.supprimer(
            adresse.searchParams.get('k'),
            adresse.searchParams.get('j')
          ));
        }
        if (requete.method !== 'POST') return json({ statut: 'requete-invalide' }, 405);

        const brutAdmin = await requete.text();
        if (brutAdmin.length > 64 * 1024) return json({ statut: 'requete-invalide' }, 413);
        let chargeAdmin;
        try {
          chargeAdmin = JSON.parse(brutAdmin);
        } catch (e) {
          return json({ statut: 'requete-invalide' }, 400);
        }
        return json(await administration.emettre(chargeAdmin && chargeAdmin.k, {
          officine: chargeAdmin && chargeAdmin.officine,
          base: adresse.origin
        }));
      }

      if (adresse.pathname === '/api/simuler') {
        if (requete.method !== 'POST') return json({ statut: 'requete-invalide' }, 405);

        // Une saisie légitime pèse quelques kilo-octets.
        const brut = await requete.text();
        if (brut.length > 64 * 1024) return json({ statut: 'requete-invalide' }, 413);

        let charge;
        try {
          charge = JSON.parse(brut);
        } catch (e) {
          return json({ statut: 'requete-invalide' }, 400);
        }
        return json(await noyau.simuler(charge && charge.jeton, charge && charge.montants));
      }

      return json({ statut: 'requete-invalide' }, 404);
    } catch (e) {
      return json({ statut: 'erreur' }, 500);
    }
  }
};
