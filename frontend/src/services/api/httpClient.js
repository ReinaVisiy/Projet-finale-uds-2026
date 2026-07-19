// src/services/api/httpClient.js
//
// Thin wrapper around fetch() shared by every service API module.
// - Automatically attaches the JWT (Authorization: Bearer <token>) when present.
// - Automatically sets Content-Type: application/json when sending a body.
// - Normalizes error handling: any non-2xx response throws an ApiError
//   with a readable message, the HTTP status, and the parsed body (if any).
// - Handles 204 No Content and non-JSON responses gracefully.

import { AUTH_TOKEN_KEY } from './config';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Build a query string from an object, skipping null/undefined/empty values.
 * e.g. buildQuery({ motCle: 'tomate', prixMax: null }) -> "?motCle=tomate"
 */
export function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  const search = new URLSearchParams();
  entries.forEach(([k, v]) => search.append(k, v));
  return `?${search.toString()}`;
}

/**
 * Core request function.
 * @param {string} baseUrl - one of the values from API_URLS
 * @param {string} path - e.g. '/api/produits/5'
 * @param {object} options - { method, body, headers, auth }
 *   auth defaults to true (attach JWT if present). Set auth: false for
 *   public endpoints where you never want a stale token sent.
 */
export async function request(baseUrl, path, options = {}) {
  const { method = 'GET', body, headers = {}, auth = true } = options;

  const finalHeaders = { ...headers };
  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // Backend unreachable, CORS failure, DNS failure, etc.
    throw new ApiError(
      `Network error while calling ${baseUrl}${path}: ${networkError.message}`,
      0,
      null
    );
  }

  // No content (e.g. 204 from DELETE)
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.erreur || payload.message || payload.error)) ||
      (typeof payload === 'string' && payload) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

// Convenience helpers
export const httpGet = (baseUrl, path, options = {}) =>
  request(baseUrl, path, { ...options, method: 'GET' });

export const httpPost = (baseUrl, path, body, options = {}) =>
  request(baseUrl, path, { ...options, method: 'POST', body });

export const httpPut = (baseUrl, path, body, options = {}) =>
  request(baseUrl, path, { ...options, method: 'PUT', body });

export const httpPatch = (baseUrl, path, body, options = {}) =>
  request(baseUrl, path, { ...options, method: 'PATCH', body });

export const httpDelete = (baseUrl, path, options = {}) =>
  request(baseUrl, path, { ...options, method: 'DELETE' });
