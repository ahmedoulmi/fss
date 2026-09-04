-- Dépôt des jetons de simulation.
-- Ni montants ni remise n'y figurent : l'outil n'est pas un dispositif
-- de collecte (SPEC §1).
CREATE TABLE IF NOT EXISTS jetons (
  jeton       TEXT PRIMARY KEY,
  officine    TEXT NOT NULL DEFAULT '',
  cree_le     TEXT NOT NULL,
  expire_le   TEXT,
  consomme_le TEXT,
  -- Suppression logique. La ligne demeure : elle continue de compter dans le
  -- plafond quotidien, sans quoi supprimer suffirait à contourner celui-ci.
  supprime_le TEXT
);

CREATE INDEX IF NOT EXISTS jetons_consomme_le ON jetons (consomme_le);

-- Simulations enregistrées (SPEC § 1, révisé).
--
-- Un jeton ne servant qu'une fois, il identifie la simulation. Le détail par
-- laboratoire est rangé en JSON : les identifiants et les montants saisis,
-- rien d'autre. Le libellé du lien n'y figure pas : il vit dans la table des
-- jetons, et se rapproche à la lecture — une seule vérité, pas deux copies.
--
-- Les taux n'y figurent pas — mais le montant de remise, rapporté aux montants
-- saisis sur assez de simulations, permettrait de les retrouver.
-- Cette base est donc à protéger au même titre que le secret BAREME.
CREATE TABLE IF NOT EXISTS simulations (
  jeton           TEXT PRIMARY KEY,
  nom             TEXT NOT NULL,
  prenom          TEXT NOT NULL,
  telephone       TEXT NOT NULL DEFAULT '',
  simule_le       TEXT NOT NULL,
  total           INTEGER NOT NULL,
  nb_laboratoires INTEGER NOT NULL,
  remise          INTEGER NOT NULL,
  taux_moyen      REAL    NOT NULL,
  detail          TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS simulations_simule_le ON simulations (simule_le);
