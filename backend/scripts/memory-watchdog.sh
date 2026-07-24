#!/usr/bin/env bash
#
# memory-watchdog.sh — surveille la memoire disponible sur l'hote et
# arrete temporairement les services les moins critiques pour une
# demonstration (certification, notification, avis) quand la memoire
# devient insuffisante, puis les redemarre automatiquement une fois
# que la memoire s'est liberee.
#
# Pourquoi ces 3 services : ce sont ceux dont l'absence temporaire
# gene le moins une demonstration du catalogue/achat (pas d'impact sur
# auth, produit, commande, paiement, utilisateur).
#
# Utilisation :
#   ./scripts/memory-watchdog.sh
# (voir scripts/memory-watchdog.service pour le faire tourner en
#  arriere-plan via systemd, y compris apres un redemarrage du serveur)
#
# Seuils (en Mo de memoire disponible, colonne "available" de `free`) :
#   - en dessous de LOW_THRESHOLD_MB  -> on arrete les 3 services
#   - au dessus de HIGH_THRESHOLD_MB -> on les redemarre
# Un ecart entre les deux seuils (hysteresis) evite les arrets/demarrages
# en boucle si la memoire oscille juste autour d'une seule valeur.

set -euo pipefail

LOW_THRESHOLD_MB="${LOW_THRESHOLD_MB:-200}"
HIGH_THRESHOLD_MB="${HIGH_THRESHOLD_MB:-450}"
CHECK_INTERVAL_SECONDS="${CHECK_INTERVAL_SECONDS:-20}"
SERVICES_A_GERER=(certification-service notification-service avis-service)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
STATE_FILE="/tmp/agrycam-watchdog-state"
LOG_PREFIX="[memory-watchdog]"

cd "$BACKEND_DIR"

# Etat initial : on suppose que les services tournent deja (cas normal
# apres un `docker compose up -d`).
if [ ! -f "$STATE_FILE" ]; then
    echo "running" > "$STATE_FILE"
fi

get_available_mb() {
    free -m | awk '/^Mem:/ {print $7}'
}

log() {
    echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') $LOG_PREFIX $1"
}

while true; do
    available_mb="$(get_available_mb)"
    etat_actuel="$(cat "$STATE_FILE")"

    if [ "$etat_actuel" = "running" ] && [ "$available_mb" -lt "$LOW_THRESHOLD_MB" ]; then
        log "Memoire disponible=${available_mb}Mo < ${LOW_THRESHOLD_MB}Mo : arret de ${SERVICES_A_GERER[*]}"
        docker compose stop "${SERVICES_A_GERER[@]}" || true
        echo "stopped" > "$STATE_FILE"

    elif [ "$etat_actuel" = "stopped" ] && [ "$available_mb" -gt "$HIGH_THRESHOLD_MB" ]; then
        log "Memoire disponible=${available_mb}Mo > ${HIGH_THRESHOLD_MB}Mo : redemarrage de ${SERVICES_A_GERER[*]}"
        docker compose start "${SERVICES_A_GERER[@]}" || true
        echo "running" > "$STATE_FILE"
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
done
