# start-all-services.ps1
# Lance les 12 processus AgryCam (10 microservices métier + eureka-server
# + api-gateway), chacun dans sa propre fenêtre PowerShell.
# À exécuter depuis la racine du projet backend (agrycam-backend/).

# IMPORTANT : Spring Boot ne charge JAMAIS automatiquement un fichier .env
# (aucune dépendance dotenv dans les pom.xml). Le fichier .env n'est donc
# qu'un modèle tant que ses variables ne sont pas explicitement exportées
# dans l'environnement. On les charge ici, dans le process courant, avant
# de lancer les microservices : chaque "Start-Process powershell" plus bas
# hérite de l'environnement du process parent, donc JWT_SECRET,
# INTERNAL_SERVICE_SECRET, DATABASE_PASSWORD, etc. seront bien visibles
# par tous les services enfants.
$EnvFile = Join-Path (Get-Location) ".env"
if (Test-Path $EnvFile) {
    Write-Host "Chargement des variables d'environnement depuis .env..." -ForegroundColor Yellow
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $nom = $Matches[1].Trim()
            $valeur = $Matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($nom, $valeur, "Process")
        }
    }
} else {
    Write-Host "ATTENTION : aucun fichier .env trouvé dans $((Get-Location).Path)." -ForegroundColor Red
    Write-Host "Copiez .env.example vers .env et renseignez vos secrets avant de continuer." -ForegroundColor Red
}

# Ordre conseillé : eureka-server en tout premier (les autres services
# s'enregistrent auprès de lui au démarrage), puis api-gateway (point
# d'entrée unique du frontend), puis utilisateur-service et auth-service,
# car plusieurs autres services en dépendent au démarrage.
$Services = @(
    "eureka-server",
    "api-gateway",
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

    # eureka-server et api-gateway ont besoin de plus de temps pour finir
    # de démarrer (contexte Spring plus long à charger) avant que les
    # services suivants ne tentent de s'enregistrer ou de router au travers
    # d'eux ; les autres services se contentent d'une pause plus courte
    # pour éviter que tous ne tapent PostgreSQL en même temps.
    if ($service -eq "eureka-server" -or $service -eq "api-gateway") {
        Start-Sleep -Seconds 20
    } else {
        Start-Sleep -Seconds 3
    }
}

Write-Host "`nLes 12 processus démarrent chacun dans leur propre fenêtre." -ForegroundColor Cyan
Write-Host "Vérifiez chaque fenêtre pour vous assurer qu'il n'y a pas d'erreur au démarrage." -ForegroundColor Cyan
