# Watchdog memoire (AWS a RAM limitee)

Sur une instance avec peu de RAM, `certification-service`,
`notification-service` et `avis-service` sont arretes automatiquement
des que la memoire disponible passe sous 200 Mo, puis redemarres des
qu'elle repasse au-dessus de 450 Mo. Ces trois services ont ete choisis
car leur absence temporaire n'empeche pas de faire une demonstration du
catalogue, des commandes ou du paiement.

## Installation (une seule fois, sur le serveur)

```bash
cd ~/Projet-finale-uds-2026/backend
chmod +x scripts/memory-watchdog.sh

# Adapter WorkingDirectory/ExecStart dans memory-watchdog.service si le
# depot n'est pas clone dans /home/ubuntu/Projet-finale-uds-2026

sudo cp scripts/memory-watchdog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now memory-watchdog
```

## Verifier que ca tourne

```bash
sudo systemctl status memory-watchdog
journalctl -u memory-watchdog -f
```

## Ajuster les seuils

Modifiable directement dans `scripts/memory-watchdog.service` en ajoutant
des variables d'environnement, par exemple :

```
Environment=LOW_THRESHOLD_MB=250
Environment=HIGH_THRESHOLD_MB=500
```

Puis `sudo systemctl daemon-reload && sudo systemctl restart memory-watchdog`.

## Arreter le watchdog

```bash
sudo systemctl stop memory-watchdog
sudo systemctl disable memory-watchdog
```
