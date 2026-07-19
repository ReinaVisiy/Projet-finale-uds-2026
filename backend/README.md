# AGRYCAM — Backend Microservices

Backend du projet **AGRYCAM**, une plateforme de mise en relation entre producteurs agricoles et consommateurs. Composé de **10 microservices** indépendants développés avec **Spring Boot**, chacun avec sa propre base de données PostgreSQL, gérés depuis un `pom.xml` parent (multi-module Maven).

## 🏗️ Architecture

| Service | Port | Base de données | Rôle |
|---|---|---|---|
| `auth-service` | 8080 | *(aucune, sans état)* | Authentification, connexion, génération des tokens JWT. Vérifie les identifiants auprès de `utilisateur-service`. |
| `utilisateur-service` | 8081 | `utilisateur_db` | Gestion des comptes (clients, producteurs, admins) — source de vérité pour les utilisateurs. |
| `produit-service` | 8082 | `produit_db` | Catalogue des produits et catégories. |
| `message-service` | 8083 | `message_db` | Messagerie entre utilisateurs. |
| `signalement-service` | 8084 | `signalement_db` | Signalement de produits ou d'utilisateurs, traitement par un administrateur. |
| `avis-service` | 8085 | `avis_db` | Avis et notes sur les produits. |
| `certification-service` | 8086 | `certification_db` | Demande et gestion des certifications des producteurs. |
| `paiement-service` | 8087 | `paiement_db` | Paiements liés aux commandes. |
| `commande-service` | 8088 | `commande_db` | Création et suivi des commandes. |
| `notification-service` | 8089 | `notification_db` | Notifications adressées aux utilisateurs (commande, paiement, certification, etc.). |

Tous les services valident les tokens JWT avec le **même secret partagé** (émis par `auth-service`), ce qui leur permet de faire confiance à l'identité de l'utilisateur (`uid`, rôles) sans se reparler entre eux à chaque requête.

### Communications inter-services

- `auth-service` → `utilisateur-service` (vérification des identifiants à la connexion)
- `produit-service` → `avis-service`, `certification-service`, `utilisateur-service` (enrichissement des fiches produit)
- `message-service` → `utilisateur-service`
- `avis-service` → `utilisateur-service`
- `commande-service` → `produit-service`, `utilisateur-service` (validation du client et des produits, prix authentique)
- `signalement-service` → `produit-service` ou `utilisateur-service` selon le type de signalement
- `paiement-service` → `commande-service`, `utilisateur-service` (via des `FeignClient`, les autres services utilisent `RestTemplate`)
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
| `JWT_SECRET` | Secret partagé pour signer/valider les tokens JWT | `AgryCamSecuriseCleJWT2026UniversiteDschang` |
| `JWT_EXPIRATION` / `JWT_EXPIRATION_MS` | Durée de validité du token (ms) | `86400000` |
| `UTILISATEUR_SERVICE_URL` | URL de `utilisateur-service` | `http://localhost:8081` |
| `PRODUIT_SERVICE_URL` | URL de `produit-service` | `http://localhost:8082` |
| `AVIS_SERVICE_URL` | URL de `avis-service` | `http://localhost:8085` |
| `CERTIFICATION_SERVICE_URL` | URL de `certification-service` | `http://localhost:8086` |
| `COMMANDE_SERVICE_URL` | URL de `commande-service` | `http://localhost:8088` |

Chaque service ne déclare que les variables correspondant aux services qu'il appelle réellement (voir la section **Communications inter-services**).

## 🚀 Lancer le projet en local

### Prérequis

- JDK 17
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

Dans un terminal séparé pour chaque service (ordre conseillé : `utilisateur-service` et `auth-service` en premier, car les autres en dépendent) :
```bash
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

## 📍 Points d'entrée principaux (préfixes)

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
