// src/services/api/authSession.js
//
// Small helper around reading/writing the logged-in user's session
// (JWT + basic identity) to localStorage. Used by authApi.login() and
// by App.jsx to restore the session on page reload.

import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from './config';

export function saveSession({ token, uid, email, roles }) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ uid, email, roles }));
}

export function getSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!token || !rawUser) return null;
  try {
    return { token, ...JSON.parse(rawUser) };
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function isAuthenticated() {
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

export function hasRole(role) {
  const session = getSession();
  return !!session?.roles?.includes(role);
}
