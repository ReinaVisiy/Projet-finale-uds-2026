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
