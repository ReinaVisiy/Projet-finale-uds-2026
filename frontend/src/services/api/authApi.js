// src/services/api/authApi.js
// Maps to auth-service (/api/auth) — port 8080 by default.

import { API_URLS } from './config';
import { httpPost } from './httpClient';
import { saveSession, clearSession } from './authSession';

const BASE = API_URLS.auth;

/**
 * Log in with email + password.
 * On success, persists the JWT + user info to localStorage and returns
 * the session object: { token, tokenType, uid, email, roles }
 */
export async function login(email, password) {
  const response = await httpPost(BASE, '/api/auth/connexion', { email, password }, { auth: false });
  saveSession({
    token: response.token,
    uid: response.uid,
    email: response.email,
    roles: response.roles,
  });
  return response;
}

export function logout() {
  clearSession();
}
