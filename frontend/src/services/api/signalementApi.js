// src/services/api/signalementApi.js
// Maps to signalement-service (/api/signalements) — port 8084 by default.

import { API_URLS } from './config';
import { httpGet, httpPost, httpPut, httpDelete, buildQuery } from './httpClient';

const BASE = API_URLS.signalement;

/**
 * Create a report.
 * request shape (SignalementRequest), e.g.:
 * { type: 'PRODUIT' | 'UTILISATEUR', targetId, reporterId, raison }
 */
export const createSignalement = (signalementRequest) =>
  httpPost(BASE, '/api/signalements', signalementRequest);

/** Get all reports (admin/moderation use). */
export const getAllSignalements = () => httpGet(BASE, '/api/signalements');

export const getSignalementById = (id) => httpGet(BASE, `/api/signalements/${id}`);

/** Get all reports filed BY a given user. */
export const getSignalementsByReporterId = (reporterId) =>
  httpGet(BASE, `/api/signalements/reporter/${reporterId}`);

/** Get all reports targeting a given product or user. type: 'PRODUIT' | 'UTILISATEUR' */
export const getSignalementsByTarget = (type, targetId) =>
  httpGet(BASE, `/api/signalements/target/${type}/${targetId}`);

/** Filter reports by status. statut: e.g. 'EN_ATTENTE' | 'TRAITE' | 'REJETE' */
export const getSignalementsByStatut = (statut) =>
  httpGet(BASE, `/api/signalements/statut/${statut}`);

/** Update a report's status. Requires ADMIN role. */
export const updateStatutSignalement = (id, statut) =>
  httpPut(BASE, `/api/signalements/${id}/statut${buildQuery({ statut })}`);

/** Delete a report. */
export const deleteSignalement = (id) => httpDelete(BASE, `/api/signalements/${id}`);
