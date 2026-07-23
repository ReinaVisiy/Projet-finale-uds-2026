// src/services/api/avisApi.js
// Maps to avis-service (/api/avis) — port 8085 by default.

import { API_URLS } from './config';
import { httpGet, httpPost, httpPut, httpDelete } from './httpClient';

const BASE = API_URLS.avis;

/** Publish a review. request: { produitId, note, commentaire } */
export const publierAvis = (avisRequest) => httpPost(BASE, '/api/avis/publier', avisRequest);

/** Edit an existing review (must be the author). */
export const modifierAvis = (id, avisRequest) => httpPut(BASE, `/api/avis/${id}`, avisRequest);

/** Delete a review (must be the author). */
export const supprimerAvis = (id) => httpDelete(BASE, `/api/avis/${id}`);

/** Get all reviews for a product. Public. */
export const getAvisParProduit = (produitId) =>
  httpGet(BASE, `/api/avis/produit/${produitId}`, { auth: false });

/** Get aggregate stats (average rating, count) for a product. Public. */
export const getAvisStats = (produitId) =>
  httpGet(BASE, `/api/avis/produit/${produitId}/stats`, { auth: false });

/** Get all reviews authored by a given client (public profile "avis laissés"). Public. */
export const getAvisParClient = (clientId) =>
  httpGet(BASE, `/api/avis/client/${clientId}`, { auth: false });

// ---- Avis "plateforme" (satisfaction générale, proposé à la déconnexion) ----

/** Publish a review of the platform itself (no produitId). request: { note, commentaire } */
export const publierAvisPlateforme = (avisRequest) =>
  httpPost(BASE, '/api/avis/plateforme/publier', avisRequest);

/** Get all platform reviews, best rating first. Public. Used for top-3 + "voir plus". */
export const getAvisPlateforme = () =>
  httpGet(BASE, '/api/avis/plateforme', { auth: false });

/** Get aggregate stats (average rating, count) for the platform. Public. */
export const getAvisStatsPlateforme = () =>
  httpGet(BASE, '/api/avis/plateforme/stats', { auth: false });

/** Whether the logged-in user has already reviewed the platform. */
export const aDejaEvaluePlateforme = () =>
  httpGet(BASE, '/api/avis/plateforme/a-deja-evalue');
