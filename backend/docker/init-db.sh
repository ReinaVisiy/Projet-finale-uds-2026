#!/bin/bash
# Cree automatiquement toutes les bases de donnees necessaires a AGRYCAM
# au premier demarrage du conteneur PostgreSQL (equivalent Docker de
# create-databases.ps1, utilise en local sous Windows).
set -e

DATABASES=(
  "utilisateur_db"
  "produit_db"
  "message_db"
  "signalement_db"
  "avis_db"
  "certification_db"
  "paiement_db"
  "commande_db"
  "notification_db"
)

for db in "${DATABASES[@]}"; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL

  if [ "$db" = "commande_db" ]; then
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" <<-EOSQL
      ALTER TABLE IF EXISTS commandes
        ADD COLUMN IF NOT EXISTS stock_decremente BOOLEAN NOT NULL DEFAULT FALSE;
EOSQL
  fi

  echo "Base $db prete."
done
