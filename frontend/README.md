# AgryCam — Frontend (Interface Utilisateur)

Frontend du projet de fin d'études **AgryCam**, une plateforme de mise en relation entre producteurs agricoles et consommateurs. Application **React 18 / Vite**, avec routage via `react-router-dom`, internationalisation via `i18next` (français / anglais), et une messagerie et des pages de certification indépendantes du reste de la navigation (accessibles uniquement par URL directe).

Ce frontend consomme l'API exposée par le [backend AgryCam](../backend) (microservices Spring Boot), en passant systématiquement par `api-gateway`.

## 🏗️ Structure du projet

```
frontend/
├── src/
│   ├── components/   # Pages et écrans (une page = un composant, ex. LoginPage, ProductCatalog...)
│   ├── services/api/ # Appels HTTP vers le backend (un fichier par domaine : authApi, produitApi, paiementApi...)
│   ├── hooks/         # Hooks React réutilisables
│   ├── i18n/          # Configuration i18next + traductions (locales/fr, locales/en)
│   └── utils/         # Fonctions utilitaires partagées
├── public/            # Assets statiques
├── .env.example       # Liste complète des variables d'environnement (voir plus bas)
└── vite.config.js     # Config Vite (serveur de dev sur le port 3000)
```

## ⚙️ Prérequis

- **Node.js** 18 ou plus récent (recommandé : dernière version LTS)
- **npm** (fourni avec Node.js)
- Le [backend AgryCam](../backend) lancé localement (au minimum `eureka-server`, `api-gateway`, et les services que vous testez), ou une URL de backend déployé

## 🚀 Installation et lancement en local

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Par défaut, `.env` pointe vers `api-gateway` en local (`http://localhost:8765`) — voir la section **Variables d'environnement** ci-dessous pour le détail de chaque variable.

### 3. Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur `http://localhost:3000` (port fixé dans `vite.config.js`) et se recharge automatiquement à chaque modification.

### 4. Construire pour la production

```bash
npm run build
```

Génère les fichiers statiques optimisés dans `dist/`. Pour prévisualiser ce build localement avant déploiement :

```bash
npm run preview
```

## 🧪 Tests et vérification

Il n'y a pas encore de suite de tests automatisés (unitaires ou end-to-end) sur le frontend — c'est une amélioration possible à venir. En attendant, deux vérifications sont disponibles :

### Analyse statique (lint)

```bash
npm run lint
```

Vérifie le code avec ESLint (règles React + hooks). À lancer avant chaque commit important pour éviter les erreurs évidentes (hooks mal utilisés, imports inutilisés, etc.).

### Vérification manuelle

Avant de pousser une modification, vérifier au minimum dans le navigateur (avec le backend lancé) :

- La connexion (`LoginPage`) et l'inscription (`Registerpage`) fonctionnent.
- Le catalogue produit (`ProductCatalog` / `ProductDetail`) charge bien les données du backend.
- La messagerie (`MessagesInbox`) et les pages de certification (`CertificationRequest`) — accessibles uniquement par URL directe, sans navigation partagée — s'affichent et communiquent correctement avec `message-service` et `certification-service`.
- La console navigateur ne montre pas d'erreurs réseau (401/403 attendus si non connecté, mais pas d'erreurs CORS ou de timeout).

## 🔐 Variables d'environnement

Toutes les variables sont documentées avec leur valeur par défaut dans [`.env.example`](./.env.example). Résumé :

| Variable | Description | Valeur par défaut |
|---|---|---|
| `VITE_API_GATEWAY_URL` | URL de la passerelle API du backend — **c'est la seule variable requise en usage normal**, toutes les requêtes passent par elle | `http://localhost:8765` |
| `VITE_AUTH_SERVICE_URL` | Contourne la passerelle pour contacter `auth-service` directement (débogage) | `http://localhost:8080` |
| `VITE_UTILISATEUR_SERVICE_URL` | Idem pour `utilisateur-service` | `http://localhost:8081` |
| `VITE_PRODUIT_SERVICE_URL` | Idem pour `produit-service` | `http://localhost:8082` |
| `VITE_MESSAGE_SERVICE_URL` | Idem pour `message-service` | `http://localhost:8083` |
| `VITE_SIGNALEMENT_SERVICE_URL` | Idem pour `signalement-service` | `http://localhost:8084` |
| `VITE_AVIS_SERVICE_URL` | Idem pour `avis-service` | `http://localhost:8085` |
| `VITE_CERTIFICATION_SERVICE_URL` | Idem pour `certification-service` | `http://localhost:8086` |
| `VITE_PAIEMENT_SERVICE_URL` | Idem pour `paiement-service` | `http://localhost:8087` |
| `VITE_COMMANDE_SERVICE_URL` | Idem pour `commande-service` | `http://localhost:8088` |
| `VITE_NOTIFICATION_SERVICE_URL` | Idem pour `notification-service` | `http://localhost:8089` |

Les variables `VITE_*_SERVICE_URL` (autres que `VITE_API_GATEWAY_URL`) sont optionnelles et commentées par défaut dans `.env.example` : elles ne servent qu'à contourner la passerelle pour un débogage ciblé sur un service précis.

### Déploiement en production

Aucune modification du code source n'est nécessaire pour déployer (Render, Netlify, etc.) : il suffit de définir `VITE_API_GATEWAY_URL` avec l'URL publique de la passerelle API déployée dans les variables d'environnement de la plateforme d'hébergement.

## 📄 Documentation complémentaire

Un guide plus détaillé (captures d'écran, parcours utilisateur) est disponible dans [`Guide.docx`](./Guide.docx).
