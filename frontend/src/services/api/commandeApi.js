// src/services/api/commandeApi.js
// Maps to commande-service (/api/commandes) — port 8088 by default.

import { API_URLS } from './config';
import { httpGet, httpPost, httpPut, httpDelete, buildQuery } from './httpClient';

const BASE = API_URLS.commande;

/**
 * Create an order.
 * request shape (CommandeRequest), e.g.:
 * { clientId, lignesCommande: [{ produitId, quantite }] }
 */
export const createCommande = (commandeRequest) =>
  httpPost(BASE, '/api/commandes', commandeRequest);

/** Get all orders (admin use). */
export const getAllCommandes = () => httpGet(BASE, '/api/commandes');

/** Public aggregate stats for the home page (no auth, no individual orders exposed). */
export const getStatsPubliques = () => httpGet(BASE, '/api/commandes/stats/publiques', { auth: false });

export const getCommandeById = (id) => httpGet(BASE, `/api/commandes/${id}`);

/** Get all orders for a given client. */
export const getCommandesByClientId = (clientId) =>
  httpGet(BASE, `/api/commandes/client/${clientId}`);

/**
 * Update an order's status.
 * statut is a StatutCommande enum value, e.g. 'EN_ATTENTE' | 'CONFIRMEE' | 'EXPEDIEE' | 'LIVREE' | 'ANNULEE'
 * (confirm exact enum values with the commande-service source/DB if unsure).
 */
export const updateStatutCommande = (id, statut) =>
  httpPut(BASE, `/api/commandes/${id}/statut${buildQuery({ statut })}`);

/** Cancel/delete an order. */
export const annulerCommande = (id) => httpDelete(BASE, `/api/commandes/${id}`);
