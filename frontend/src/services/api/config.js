// src/services/api/config.js
//
// Base URLs for every backend microservice.
//
// As of the API Gateway, the frontend no longer needs to know each
// microservice's own port — every request goes through the gateway
// (VITE_API_GATEWAY_URL, defaults to http://localhost:8765), which
// routes /api/xxx/** to the right service via Eureka. Each entry below
// can still be individually overridden (e.g. VITE_UTILISATEUR_SERVICE_URL)
// for local debugging against a single service directly, bypassing the
// gateway — but in normal use they all resolve to the same gateway URL.

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8765';

export const API_URLS = {
  auth: import.meta.env.VITE_AUTH_SERVICE_URL || GATEWAY_URL,
  utilisateur: import.meta.env.VITE_UTILISATEUR_SERVICE_URL || GATEWAY_URL,
  produit: import.meta.env.VITE_PRODUIT_SERVICE_URL || GATEWAY_URL,
  message: import.meta.env.VITE_MESSAGE_SERVICE_URL || GATEWAY_URL,
  signalement: import.meta.env.VITE_SIGNALEMENT_SERVICE_URL || GATEWAY_URL,
  avis: import.meta.env.VITE_AVIS_SERVICE_URL || GATEWAY_URL,
  certification: import.meta.env.VITE_CERTIFICATION_SERVICE_URL || GATEWAY_URL,
  paiement: import.meta.env.VITE_PAIEMENT_SERVICE_URL || GATEWAY_URL,
  commande: import.meta.env.VITE_COMMANDE_SERVICE_URL || GATEWAY_URL,
  notification: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || GATEWAY_URL,
};

// Key used to persist the JWT (and basic user info) in localStorage.
export const AUTH_TOKEN_KEY = 'agrycam_token';
export const AUTH_USER_KEY = 'agrycam_user';
