# start-all-services.ps1
# Lance les 10 microservices AgryCam, chacun dans sa propre fenêtre PowerShell.
# À exécuter depuis la racine du projet backend (agrycam-backend/).

# Ordre conseillé : utilisateur-service et auth-service en premier,
# car plusieurs autres services en dépendent au démarrage.
$Services = @(
    "utilisateur-service",
    "auth-service",
    "produit-service",
    "message-service",
    "signalement-service",
    "avis-service",
    "certification-service",
    "paiement-service",
    "commande-service",
    "notification-service"
)

$Root = Get-Location

foreach ($service in $Services) {
    $path = Join-Path $Root $service

    if (-Not (Test-Path $path)) {
        Write-Host "INTROUVABLE - $service (dossier absent, ignoré)" -ForegroundColor Red
        continue
    }

    Write-Host "Démarrage de $service..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$path'; mvn spring-boot:run"

    # Petite pause pour éviter que tous les services ne tapent PostgreSQL en même temps
    Start-Sleep -Seconds 3
}

Write-Host "`nLes 10 services démarrent chacun dans leur propre fenêtre." -ForegroundColor Cyan
Write-Host "Vérifiez chaque fenêtre pour vous assurer qu'il n'y a pas d'erreur au démarrage." -ForegroundColor Cyan
