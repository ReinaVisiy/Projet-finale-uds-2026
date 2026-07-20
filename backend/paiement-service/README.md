# AgryCam - Service de Paiement Séquestre via Simiz (paiement-simiz-service)

Ce service est un microservice Spring Boot robuste pour la plateforme **AgryCam** (marketplace agricole camerounaise). Il remplace l'ancien système manuel par une intégration automatisée avec la passerelle de paiement **Simiz** (sandbox) et implémente un modèle de **séquestre (escrow)** sécurisé pour les transactions de la plateforme.

## 🌟 Fonctionnalités clés

- **Modèle Marketplace avec Séquestre** : Le client paie la plateforme directement. Les fonds sont conservés en attente de vérification.
- **Répartition automatique** : Une commission fixe de **5%** est prélevée pour la plateforme AgryCam, et le solde net de **95%** est automatiquement crédité sur le portefeuille (wallet) du vendeur lors de la validation du paiement.
- **Traitement générique (Multi-références)** : Le service peut traiter les paiements de deux types d'éléments distincts :
  - `COMMANDE` (Achat d'un produit sur la marketplace).
  - `CERTIFICATION` (Frais d'abonnement ou de certification de producteur).
- **Double mécanisme de confirmation** :
  1. **Polling (Sondage API)** : Interrogation proactive sécurisée de l'API de Simiz par le service pour mettre à jour l'état de la transaction. C'est le mécanisme principal et le plus fiable.
  2. **Webhook** : Endpoint passif public (`POST /api/paiements/webhook/simiz`) qui reçoit les notifications de Simiz en production (avec double validation via interrogation de l'API Simiz pour parer au spoofing).
- **Retraits simplifiés pour les vendeurs** : Retrait direct du solde cumulé par le vendeur connecté, sans approbation de l'administrateur (simulation de virement de fonds en base avec génération d'un reçu officiel factice et référence de paiement unique `PAYOUT-UUID`).

---

## 🛠️ Variables d'environnement requises

Les configurations sensibles et les URL d'intégration inter-services doivent être définies via les variables d'environnement suivantes :

| Variable | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `PORT` | Port d'écoute du microservice | `8090` |
| `DATABASE_URL` | URL JDBC complète de la base PostgreSQL (harmonisé avec les autres microservices AgryCam) | `jdbc:postgresql://localhost:5432/paiement_simiz_db` |
| `DATABASE_USERNAME` | Nom d'utilisateur de la base de données | `postgres` |
| `DATABASE_PASSWORD` | Mot de passe de la base de données | `2026` |
| `JWT_SECRET` | Clé secrète partagée d'authentification JWT d'AgryCam — **doit être identique dans tous les microservices**, sinon ce service rejette silencieusement les tokens valides émis par `auth-service` | `AgryCamSecuriseCleJWT2026UniversiteDschang` |
| `SIMIZ_SECRET_KEY` | Clé secrète d'API Simiz Sandbox — optionnelle en local (le service bascule sur une simulation si absente ou si l'appel échoue), **obligatoire** pour de vrais paiements | *Vide par défaut* |
| `SIMIZ_PUBLIC_KEY` | Clé publique d'API Simiz Sandbox | *Vide par défaut* |
| `FRONTEND_URL` | URL du frontend AgryCam (pas de ce service) — sert à construire les URLs de retour Simiz (`successUrl`/`cancelUrl`) vers lesquelles le client est redirigé après paiement | `http://localhost:3000` |

---

## 🚀 Lancement & Déploiement

### 1. Prérequis
- Java 21 installé
- PostgreSQL installé avec une base de données nommée `paiement_simiz_db`
- Maven configuré

### 2. Lancement en local
Définissez vos clés Simiz et lancez l'application :
```bash
export SIMIZ_SECRET_KEY="votre_cle_secrete_simiz"
export SIMIZ_PUBLIC_KEY="votre_cle_publique_simiz"
mvn spring-boot:run
```

Le service démarre sur le port `8090`.

### 3. Déploiement sur une plateforme cloud (Render, Heroku, etc.)
Le service détectera automatiquement la variable d'environnement `PORT` injectée par la plateforme d'hébergement.
1. Créez une instance de base de données PostgreSQL managée.
2. Déployez le projet à l'aide du fichier `pom.xml`.
3. Renseignez les variables d'environnement listées dans la section précédente (notamment `FRONTEND_URL` avec l'adresse publique de l'application frontend déployée, pour permettre la construction correcte des URLs de retour Simiz).

---

## 📡 API Endpoints

Tous les endpoints nécessitent un Header `Authorization: Bearer <JWT_TOKEN>` sauf le webhook Simiz. Le token JWT doit contenir les claims standard d'AgryCam : `uid` (identifiant utilisateur, Long) et `roles` (liste de rôles, ex: `["VENDEUR"]` ou `["CLIENT"]`).

### 🧑‍💻 Rôle Client (Acheteur)
- **Initier un Paiement** : `POST /api/paiements/initier`
  - *Body* :
    ```json
    {
      "typeReference": "COMMANDE",
      "referenceId": 123,
      "vendeurId": 45,
      "montant": 15000.00
    }
    ```
  - *Réponse* : Crée une transaction locale en statut `EN_ATTENTE`, initie la session chez Simiz, et retourne la transaction contenant `simizCheckoutUrl` (vers laquelle rediriger le client).

### 🧑‍🌾 Rôle Vendeur
- **Récupérer mon Solde** : `GET /api/paiements/mon-solde`
  - *Réponse* : Retourne le portefeuille du vendeur avec son solde actuel (crédité de 95% des ventes validées).
- **Mes Transactions** : `GET /api/paiements/mes-transactions`
  - *Réponse* : Liste toutes les ventes associées au vendeur connecté.
- **Demander un Retrait** : `POST /api/paiements/retrait`
  - *Body* :
    ```json
    {
      "montant": 10000.00
    }
    ```
  - *Réponse* : Débite le solde, enregistre un reçu de retrait et génère une référence de virement unique (`PAYOUT-UUID`).
- **Mes Retraits** : `GET /api/paiements/mes-retraits`
  - *Réponse* : Historique des retraits effectués.

### 🔌 Intégration Inter-Services & Vérification (Public / Interne)
- **Vérifier un paiement (Sondage / Polling)** : `GET /api/paiements/{id}/verifier`
  - Interroge l'API Simiz. Si Simiz confirme le paiement (`SUCCESSFUL`), la transaction passe au statut `PAYE`, et le portefeuille du vendeur est immédiatement crédité. Renvoie la transaction à jour.
- **Récupérer le statut résumé** : `GET /api/paiements/statut/{typeReference}/{referenceId}`
  - Permet aux services de commandes ou de certifications de vérifier si une entité liée est payée sans exposer de détails sensibles.
- **Webhook Simiz (Public)** : `POST /api/paiements/webhook/simiz`
  - Réceptionne les notifications asynchrones de la passerelle. Déclenche immédiatement une re-vérification sécurisée via API par précaution de sécurité.

### 👑 Rôle Administrateur
- **Historique Global** : `GET /api/paiements/admin/toutes-transactions`
  - Liste l'ensemble des transactions (utile pour le tableau de bord des ventes et le suivi des commissions de 5% de la plateforme).

---

## 🔄 Flux d'exécution complet

### Scénario 1 : Développement local avec Polling (Principal)
1. **Initiation** : Le client choisit de payer sa commande. Le frontend appelle `POST /api/paiements/initier`. Le service renvoie un objet Transaction contenant une URL Simiz Sandbox.
2. **Redirection** : Le frontend redirige le client vers la page de paiement Simiz (sandbox).
3. **Paiement** : Le client valide son paiement sur la sandbox. Simiz le redirige vers l'URL de succès d'AgryCam (`successUrl` configurée).
4. **Vérification** : À l'arrivée sur l'écran de succès, le frontend déclenche un appel de sondage régulier ou un appel immédiat vers `GET /api/paiements/{id}/verifier`. Le service interroge Simiz en direct par API, confirme le paiement, met à jour le statut à `PAYE` et crédite 95% du montant sur le solde du vendeur.

### Scénario 2 : Déployé (Polling + Webhook en complément)
1. Même flux qu'en local.
2. Lorsque l'utilisateur paie sur Simiz, Simiz notifie de manière asynchrone notre webhook `POST /api/paiements/webhook/simiz`.
3. Notre service interroge à nouveau Simiz par API pour valider la notification et sécuriser la transaction, évitant ainsi que le client doive attendre d'ouvrir la page de succès pour libérer le séquestre. Le polling reste présent en secours au cas où le webhook échoue ou que le service était temporairement en veille (sur les plateformes d'hébergement gratuites).
