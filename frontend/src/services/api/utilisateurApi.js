// src/services/api/utilisateurApi.js
// Maps to utilisateur-service (/api/utilisateurs) — port 8081 by default.

import { API_URLS } from './config';
import { httpGet, httpPost, httpPut, httpDelete, buildQuery } from './httpClient';

const BASE = API_URLS.utilisateur;

/** Get all users (admin use). */
export const getAllUtilisateurs = () => httpGet(BASE, '/api/utilisateurs');

/** Get a single user by id. */
export const getUtilisateurById = (id) => httpGet(BASE, `/api/utilisateurs/${id}`);

/** Search users by name. */
export const rechercherUtilisateurs = (nom) =>
  httpGet(BASE, `/api/utilisateurs/recherche${buildQuery({ nom })}`);

/**
 * Register a new user.
 * utilisateur shape (backend entity), e.g.:
 * { nom, email, password, telephone, role: 'CLIENT' | 'PRODUCTEUR', ... }
 */
export const createUtilisateur = (utilisateur) =>
  httpPost(BASE, '/api/utilisateurs', utilisateur, { auth: false });

/** Create an admin account (admin use). */
export const creerAdministrateur = ({ nom, email, password }) =>
  httpPost(BASE, '/api/utilisateurs/admin/creer', { nom, email, password });

/**
 * Update a user's profile.
 * updates shape depends on UpdateProfilRequest, e.g.:
 * { nom, telephone, localisation, ... }
 */
export const updateProfil = (id, updates) => httpPut(BASE, `/api/utilisateurs/${id}`, updates);

/** Delete a user account. */
export const deleteUtilisateur = (id) => httpDelete(BASE, `/api/utilisateurs/${id}`);

/**
 * Change a user's password. Backend verifies ancienMotDePasse before
 * applying nouveauMotDePasse (PUT /api/utilisateurs/{id}/mot-de-passe).
 * Throws (via httpPut) if the current password is wrong (400) or the
 * user isn't found (404).
 */
export const changerMotDePasse = (id, ancienMotDePasse, nouveauMotDePasse) =>
  httpPut(BASE, `/api/utilisateurs/${id}/mot-de-passe`, { ancienMotDePasse, nouveauMotDePasse });

/**
 * Suspendre/lever la suspension d'un compte (admin uniquement).
 * PUT /api/utilisateurs/{id}/suspension avec { jours }.
 * jours == null ou <= 0 lève la suspension immédiatement ; sinon le
 * compte est suspendu jusqu'à maintenant + jours (vérifié par
 * auth-service à la connexion).
 */
export const suspendreUtilisateur = (id, jours) =>
  httpPut(BASE, `/api/utilisateurs/${id}/suspension`, { jours });
