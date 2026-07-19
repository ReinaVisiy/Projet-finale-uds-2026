// src/services/api/config.js
//
// Base URLs for every backend microservice.
// Each one reads from a Vite env variable (VITE_*) with a localhost
// fallback for local development. This means deploying the app is just
// a matter of setting these env vars at build time (e.g. in a
// .env.production file, or in Render/Vercel/Netlify's dashboard) —
// no source code changes required.

export const API_URLS = {
  auth: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8080',
  utilisateur: import.meta.env.VITE_UTILISATEUR_SERVICE_URL || 'http://localhost:8081',
  produit: import.meta.env.VITE_PRODUIT_SERVICE_URL || 'http://localhost:8082',
  message: import.meta.env.VITE_MESSAGE_SERVICE_URL || 'http://localhost:8083',
  signalement: import.meta.env.VITE_SIGNALEMENT_SERVICE_URL || 'http://localhost:8084',
  avis: import.meta.env.VITE_AVIS_SERVICE_URL || 'http://localhost:8085',
  certification: import.meta.env.VITE_CERTIFICATION_SERVICE_URL || 'http://localhost:8086',
  paiement: import.meta.env.VITE_PAIEMENT_SERVICE_URL || 'http://localhost:8087',
  commande: import.meta.env.VITE_COMMANDE_SERVICE_URL || 'http://localhost:8088',
  notification: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8089',
};

// Key used to persist the JWT (and basic user info) in localStorage.
export const AUTH_TOKEN_KEY = 'agrycam_token';
export const AUTH_USER_KEY = 'agrycam_user';
