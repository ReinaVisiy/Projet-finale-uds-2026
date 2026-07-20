# create-databases.ps1
# Crée toutes les bases de données PostgreSQL nécessaires à AgryCam,
# uniquement si elles n'existent pas déjà.

# --- À adapter si vos identifiants PostgreSQL sont différents ---
$PgUser = "postgres"
$PgPassword = "2026"
$PgHost = "localhost"
$PgPort = "5432"

$Databases = @(
    "utilisateur_db",
    "produit_db",
    "message_db",
    "signalement_db",
    "avis_db",
    "certification_db",
    "paiement_simiz_db",
    "commande_db",
    "notification_db"
)

$env:PGPASSWORD = $PgPassword

foreach ($db in $Databases) {
    $exists = psql -U $PgUser -h $PgHost -p $PgPort -tAc "SELECT 1 FROM pg_database WHERE datname='$db'"

    if ($exists -eq "1") {
        Write-Host "OK   - $db existe déjà, rien à faire" -ForegroundColor Yellow
    } else {
        psql -U $PgUser -h $PgHost -p $PgPort -c "CREATE DATABASE $db;" | Out-Null
        Write-Host "CREE - $db créée avec succès" -ForegroundColor Green
    }
}

Remove-Item Env:\PGPASSWORD

Write-Host "`nToutes les bases sont prêtes." -ForegroundColor Cyan
