-- Dépôt des jetons de simulation.
-- Ni montants ni remise n'y figurent : l'outil n'est pas un dispositif
-- de collecte (SPEC §1).
CREATE TABLE IF NOT EXISTS jetons (
  jeton       TEXT PRIMARY KEY,
  officine    TEXT NOT NULL DEFAULT '',
  cree_le     TEXT NOT NULL,
  expire_le   TEXT,
  consomme_le TEXT
);

CREATE INDEX IF NOT EXISTS jetons_consomme_le ON jetons (consomme_le);
