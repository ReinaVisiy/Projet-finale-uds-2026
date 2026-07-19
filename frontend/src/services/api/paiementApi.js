// src/services/api/paiementApi.js
// Maps to paiement-service (/api/paiements) — port 8087 by default.

import { API_URLS } from './config';
import { httpGet, httpPost, httpPatch, buildQuery } from './httpClient';

const BASE = API_URLS.paiement;

/**
 * Create a payment.
 * request shape (Paiement entity), e.g.:
 * { commandeId, consommateurId, montant, moyenPaiement, ... }
 */
export const creerPaiement = (paiement) => httpPost(BASE, '/api/paiements', paiement);

export const getPaiementById = (id) => httpGet(BASE, `/api/paiements/${id}`);

export const getPaiementsByCommande = (commandeId) =>
  httpGet(BASE, `/api/paiements/commande/${commandeId}`);

export const getPaiementsByConsommateur = (consommateurId) =>
  httpGet(BASE, `/api/paiements/consommateur/${consommateurId}`);

/**
 * Update a payment's status.
 * statut is a StatutPaiement enum value (e.g. 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' —
 * confirm exact values with paiement-service source if unsure).
 */
export const mettreAJourStatutPaiement = (id, statut) =>
  httpPatch(BASE, `/api/paiements/${id}/statut${buildQuery({ statut })}`);

/** Get all payments (admin use). */
export const getAllPaiements = () => httpGet(BASE, '/api/paiements');
