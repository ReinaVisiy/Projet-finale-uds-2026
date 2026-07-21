# AGRYCAM — Backend Microservices

Backend du projet **AGRYCAM**, une plateforme de mise en relation entre producteurs agricoles et consommateurs. Composé de **12 microservices** indépendants développés avec **Spring Boot** (10 services métier + un serveur de découverte Eureka + une passerelle API), chacun avec sa propre base de données PostgreSQL (sauf `eureka-server` et `api-gateway`, sans état), gérés depuis un `pom.xml` parent (multi-module Maven).

## 🏗️ Architecture

| Service | Port | Base de données | Rôle |
|---|---|---|---|
| `eureka-server` | 8761 | *(aucune, sans état)* | Serveur de découverte : tous les autres services s'y enregistrent au démarrage et l'utilisent pour se localiser entre eux. Console web sur `http://localhost:8761`. |
| `api-gateway` | 8765 | *(aucune, sans état)* | **Point d'entrée unique du frontend.** Route chaque requête `/api/xxx/**` vers le bon microservice (résolu dynamiquement via `eureka-server`, plus besoin de connaître le port de chaque service). Gère aussi le CORS pour le navigateur — voir la section dédiée ci-dessous. |
| `auth-service` | 8080 | *(aucune, sans état)* | Authentification, connexion, génération des tokens JWT. Vérifie les identifiants auprès de `utilisateur-service`. |
| `utilisateur-service` | 8081 | `utilisateur_db` | Gestion des comptes (clients, producteurs, admins) — source de vérité pour les utilisateurs. |
| `produit-service` | 8082 | `produit_db` | Catalogue des produits et catégories. |
| `message-service` | 8083 | `message_db` | Messagerie entre utilisateurs. |
| `signalement-service` | 8084 | `signalement_db` | Signalement de produits ou d'utilisateurs, traitement par un administrateur. |
| `avis-service` | 8085 | `avis_db` | Avis et notes sur les produits. |
| `certification-service` | 8086 | `certification_db` | Demande et gestion des certifications des producteurs. |
| `paiement-service` | 8087 | `paiement_db` | Paiements via la passerelle NotchPay (transactions, retraits, solde vendeur). |
| `commande-service` | 8088 | `commande_db` | Création et suivi des commandes. |
| `notification-service` | 8089 | `notification_db` | Notifications adressées aux utilisateurs (commande, paiement, certification, etc.). |

Tous les services valident les tokens JWT avec le **même secret partagé** (émis par `auth-service`), ce qui leur permet de faire confiance à l'identité de l'utilisateur (`uid`, rôles) sans se reparler entre eux à chaque requête.

### Découverte de services (Eureka) et passerelle API

Chaque service métier embarque `spring-cloud-starter-netflix-eureka-client` et s'enregistre auprès d'`eureka-server` au démarrage (`eureka.client.service-url.defaultZone`, par défaut `http://localhost:8761/eureka/`, surchargeable via la variable d'environnement `EUREKA_URI`).

**Le frontend ne parle plus à chaque microservice sur son propre port.** Il appelle uniquement `api-gateway` (port 8765, variable `VITE_API_GATEWAY_URL`), qui route chaque préfixe `/api/xxx/**` vers le bon service via une route `lb://<nom-du-service>` résolue dynamiquement dans Eureka — voir `api-gateway/src/main/resources/application.properties` pour la liste des routes. C'est aussi la passerelle qui gère le CORS pour le navigateur maintenant (chaque service garde son `@CrossOrigin(origins = "*")` pour le débogage direct, mais ce n'est plus lui que le navigateur contacte en usage normal).

Les appels **entre microservices** (ex. `avis-service` → `utilisateur-service` pour récupérer un nom d'utilisateur) continuent en revanche d'utiliser des URLs fixes habituelles (`RestTemplate` + `*.service.url`, voir la liste ci-dessous) plutôt que de passer par la passerelle ou par Eureka — ça reste la prochaine étape possible si besoin.

### Communications inter-services

- `auth-service` → `utilisateur-service` (vérification des identifiants à la connexion)
- `produit-service` → `avis-service`, `certification-service`, `utilisateur-service` (enrichissement des fiches produit)
- `message-service` → `utilisateur-service`
- `avis-service` → `utilisateur-service`
- `commande-service` → `produit-service`, `utilisateur-service` (validation du client et des produits, prix authentique)
- `signalement-service` → `produit-service` ou `utilisateur-service` selon le type de signalement
- `paiement-service` : n'appelle aucun autre microservice AgryCam pour l'instant (uniquement l'API externe NotchPay via `RestTemplate`) ; à l'inverse, il expose `GET /api/paiements/statut/{typeReference}/{referenceId}` pour que `commande-service` et `certification-service` puissent vérifier si une commande/certification a été payée — voir la section suivante
- `notification-service` ne reçoit pour l'instant d'appels que du frontend (aucun autre microservice ne le déclenche encore automatiquement)

Ces URLs sont définies par des variables d'environnement, avec une valeur par défaut pointant vers `localhost` pour le développement local (voir la section **Variables d'environnement**).

## 🔐 Sécurité

- Chaque service (sauf `auth-service`, qui n'a pas de base de données) valide les requêtes via un filtre JWT (`JwtAuthFilter` + `JwtUtil`), en lisant l'en-tête `Authorization: Bearer <token>`.
- Le secret JWT partagé est `jwt.secret` dans chaque `application.properties` — **doit rester identique partout**, sinon la validation échoue silencieusement (un service rejettera des tokens valides émis par un autre).
- Les endpoints `GET` publics (catalogue produit, avis, etc.) sont accessibles sans authentification ; tout le reste nécessite un token valide.
- `certification-service` restreint en plus certains endpoints au rôle `ADMIN` via `@PreAuthorize`.
- Lorsqu'un service appelle un autre microservice (`RestTemplate` ou `FeignClient`), le token JWT présent dans la requête entrante est automatiquement propagé dans l'appel sortant, via un intercepteur (`JwtPropagationInterceptor` ou `FeignConfig`). Cela permet à un endpoint interne de devenir protégé sans casser la communication inter-services.

## ⚙️ Variables d'environnement

Chaque service lit sa configuration depuis `application.properties`, avec des valeurs par défaut adaptées à un développement en local (PostgreSQL sur `localhost:5432`, services sur `localhost`). En production (Render, Docker, etc.), ces variables sont surchargées :

| Variable | Description | Valeur par défaut (locale) |
|---|---|---|
| `PORT` | Port d'écoute du service | Voir tableau Architecture |
| `DATABASE_URL` | URL JDBC de la base PostgreSQL du service | `jdbc:postgresql://localhost:5432/<nom>_db` |
| `DATABASE_USERNAME` | Utilisateur PostgreSQL | `postgres` |
| `DATABASE_PASSWORD` | Mot de passe PostgreSQL | `2026` |
| `JWT_SECRET` | Secret partagé pour signer/valider les tokens JWT (**obligatoire, aucune valeur par défaut** — voir README racine) | *(à générer, ex. `openssl rand -base64 48`)* |
| `JWT_EXPIRATION` / `JWT_EXPIRATION_MS` | Durée de validité du token (ms) | `86400000` |
| `UTILISATEUR_SERVICE_URL` | URL de `utilisateur-service` | `http://localhost:8081` |
| `PRODUIT_SERVICE_URL` | URL de `produit-service` | `http://localhost:8082` |
| `AVIS_SERVICE_URL` | URL de `avis-service` | `http://localhost:8085` |
| `CERTIFICATION_SERVICE_URL` | URL de `certification-service` | `http://localhost:8086` |
| `PAIEMENT_SERVICE_URL` | URL de `paiement-service` | `http://localhost:8087` |
| `COMMANDE_SERVICE_URL` | URL de `commande-service` | `http://localhost:8088` |
| `FRONTEND_URL` | URL du frontend déployé (utilisée par `paiement-service` pour les retours NotchPay) | `http://localhost:3000` |
| `NOTCHPAY_SECRET_KEY` / `NOTCHPAY_PUBLIC_KEY` | Clés de la passerelle de paiement NotchPay (sandbox), utilisées par `paiement-service` — la clé publique est obligatoire, sans quoi l'initiation de paiement échoue (401, pas de simulation de secours) | *Vide par défaut* |
| `INTERNAL_SERVICE_SECRET` | Secret partagé entre `auth-service` et `utilisateur-service` pour leurs appels internes | *(à générer — voir README racine)* |
| `EUREKA_URI` | URL du serveur Eureka auprès duquel chaque service s'enregistre | `http://localhost:8761/eureka/` |
| `EUREKA_HOSTNAME` | Nom d'hôte annoncé par `eureka-server` lui-même | `localhost` |

Chaque service ne déclare que les variables correspondant aux services qu'il appelle réellement (voir la section **Communications inter-services**).

Un fichier [`backend/.env.example`](./.env.example) regroupe la liste complète ci-dessus avec des commentaires : copiez-le en `.env` (ou reportez ces variables dans votre outil de lancement / plateforme de déploiement) pour éviter de tout ressaisir à la main.

## 🚀 Lancer le projet en local

### Prérequis

- JDK 21
- Maven
- PostgreSQL installé et lancé localement (port 5432, utilisateur `postgres`, mot de passe `2026` — à adapter si différent chez vous)

### 1. Créer les bases de données

```sql
CREATE DATABASE utilisateur_db;
CREATE DATABASE produit_db;
CREATE DATABASE message_db;
CREATE DATABASE signalement_db;
CREATE DATABASE avis_db;
CREATE DATABASE certification_db;
CREATE DATABASE paiement_db;
CREATE DATABASE commande_db;
CREATE DATABASE notification_db;
```

### 2. Compiler tous les services

Depuis la racine du projet :
```bash
mvn clean install -DskipTests
```

### 3. Lancer chaque service

Dans un terminal séparé pour chaque service. **`eureka-server` doit démarrer en premier** (les autres s'enregistrent auprès de lui), puis `api-gateway`, puis `utilisateur-service` et `auth-service` (les autres en dépendent) :
```bash
cd eureka-server && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run
cd utilisateur-service && mvn spring-boot:run
cd auth-service && mvn spring-boot:run
cd produit-service && mvn spring-boot:run
cd message-service && mvn spring-boot:run
cd signalement-service && mvn spring-boot:run
cd avis-service && mvn spring-boot:run
cd certification-service && mvn spring-boot:run
cd paiement-service && mvn spring-boot:run
cd commande-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
```

Ou plus simplement, `./start-all-services.ps1` depuis PowerShell, qui respecte déjà cet ordre.

### 4. Vérifier que tout fonctionne

- La console Eureka (`http://localhost:8761`) doit lister les 10 services métier enregistrés après leur démarrage (`api-gateway` s'y enregistre aussi, ce qui fait 11 entrées au total).
- `http://localhost:8765/api/utilisateurs` (via `api-gateway`) doit répondre sans erreur de connexion (401/403 si non authentifié, mais pas de timeout).
- En cas d'échec au démarrage d'un service, vérifier en premier que `JWT_SECRET` (et `INTERNAL_SERVICE_SECRET` pour `auth-service`/`utilisateur-service`) sont bien exportés — voir le README racine.

## 🐳 Lancer le projet avec Docker

Chaque microservice possède son propre `Dockerfile` (build multi-stage :
compilation avec Maven, puis image d'exécution allégée avec le JRE seul).
Un `docker-compose.yml` à la racine de `backend/` orchestre PostgreSQL,
`eureka-server`, `api-gateway` et les 10 services métier.

### 1. Préparer les variables d'environnement

```bash
cp .env.example .env
```

Puis remplir `.env` (`JWT_SECRET`, `INTERNAL_SERVICE_SECRET`, et les clés
NotchPay si besoin — voir la section "Variables d'environnement" ci-dessus).
Ce fichier ne doit jamais être commité.

### 2. Lancer toute la stack

```bash
docker compose up --build
```

PostgreSQL crée automatiquement les 9 bases de données nécessaires au
premier démarrage (voir `docker/init-db.sh`, l'équivalent Docker de
`create-databases.ps1`). Les services attendent que `postgres` et
`eureka-server` soient prêts avant de démarrer.

### 3. Reconstruire un seul service après une modification

```bash
docker compose up --build produit-service
```

### 4. Arrêter et nettoyer

```bash
docker compose down          # arrête les conteneurs, garde les données
docker compose down -v       # arrête et supprime aussi le volume Postgres
```

## 🧪 Tests

Chaque service dispose d'un test de contexte Spring Boot minimal (vérifie que le contexte de l'application démarre sans erreur) ; certains services (`certification-service`, `utilisateur-service`, `message-service`, `auth-service`, `produit-service`, `avis-service`) contiennent une classe `*ApplicationTests`. Il n'y a pas encore de suite de tests unitaires/d'intégration complète sur la logique métier — c'est une amélioration possible à venir.

Lancer les tests d'un service précis :
```bash
cd <nom-du-service> && mvn test
```

Lancer les tests de tous les services depuis la racine `backend/` :
```bash
mvn clean test
```

**Important** : ces tests chargent le contexte Spring complet, donc `JWT_SECRET` (et `INTERNAL_SERVICE_SECRET` si applicable) doivent être exportés dans l'environnement avant de lancer `mvn test`, sinon le contexte ne démarre pas et le test échoue pour une raison qui n'a rien à voir avec le code testé.

## 📍 Points d'entrée principaux (préfixes)

Le frontend appelle uniquement `api-gateway` (`http://localhost:8765`), qui route chaque préfixe vers le bon service :

| Service | Préfixe des endpoints |
|---|---|
| auth-service | `/api/auth` |
| utilisateur-service | `/api/utilisateurs` |
| produit-service | `/api/produits`, `/api/categories` |
| message-service | `/api/messages` |
| signalement-service | `/api/signalements` |
| avis-service | `/api/avis` |
| certification-service | `/api/certifications` |
| paiement-service | `/api/paiements` |
| commande-service | `/api/commandes` |
| notification-service | `/api/notifications` |
