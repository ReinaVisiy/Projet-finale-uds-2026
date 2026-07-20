# Projet-finale-uds-2026 — AgryCam

Dépôt de travail combiné pour le projet de fin d'études AgryCam.
Contient les deux dépôts d'origine réunis dans des dossiers séparés,
pour travailler sur les corrections sans risquer de casser les dépôts
d'origine avant validation.

- `frontend/` — Interfaces (React/Vite) — dépôt d'origine : maevaelvira41-code/Interfaces
- `backend/` — projetfinann-e (Spring Boot, microservices) — dépôt d'origine : borelleG/projetfinann-e

Une fois les corrections validées ici, elles seront reportées vers les
dépôts d'origine (ou ce dépôt deviendra la référence, selon décision de
l'équipe).

## Variables d'environnement obligatoires (backend)

Les microservices ne définissent plus de valeur par défaut pour les
secrets : il faut désormais exporter ces variables d'environnement
avant de lancer chaque service (local, CI ou production), sinon le
démarrage échouera.

- `JWT_SECRET` — requis par tous les microservices (auth, utilisateur,
  produit, commande, paiement, certification, signalement,
  notification, message, avis).
- `INTERNAL_SERVICE_SECRET` — requis par `auth-service` et
  `utilisateur-service` (doit être la même valeur dans les deux).

Générer une valeur aléatoire suffisamment longue, par exemple :

```bash
openssl rand -base64 48
```

Ne jamais committer ces valeurs dans le dépôt (application.properties,
docker-compose, etc.) : elles doivent uniquement exister dans
l'environnement d'exécution (variables d'environnement, secrets du
gestionnaire de déploiement, etc.).

## Guides d'installation

- Backend : voir [`backend/README.md`](./backend/README.md) (architecture, variables d'environnement, lancement, tests) et [`backend/.env.example`](./backend/.env.example).
- Frontend : voir [`frontend/README.md`](./frontend/README.md) et [`frontend/.env.example`](./frontend/.env.example).
