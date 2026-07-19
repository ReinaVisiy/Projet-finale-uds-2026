// src/services/api/produitApi.js
// Maps to produit-service (/api/produits, /api/categories) — port 8082 by default.

import { API_URLS } from './config';
import { httpGet, httpPost, httpPut, httpDelete, buildQuery } from './httpClient';

const BASE = API_URLS.produit;

// ---- Produits ----

/** Default product listing (catalogue home). Public, no auth needed. */
export const getAffichageParDefaut = () => httpGet(BASE, '/api/produits', { auth: false });

/**
 * Search products with filters. All params optional.
 * { motCle, localisation, categorieId, prixMin, prixMax, stockMin, dateLimite, noteMin, tri }
 */
export const rechercherProduits = (filters = {}) =>
  httpGet(BASE, `/api/produits/recherche${buildQuery(filters)}`, { auth: false });

/** Get the logged-in producer's own products. Requires auth. */
export const getMesProduits = () => httpGet(BASE, '/api/produits/mes-produits');

/** Get a producer's products publicly (producer profile page). No auth needed. */
export const getProduitsParProducteur = (producteurId) =>
  httpGet(BASE, `/api/produits/producteur/${producteurId}`, { auth: false });

/** Get one product by id. Public. */
export const getProduitById = (id) => httpGet(BASE, `/api/produits/${id}`, { auth: false });

/**
 * Publish a new product. Requires auth (producteur role).
 * request shape (ProduitRequest), e.g.:
 * { nom, description, prix, stock, categorieId, localisation, imageUrl, ... }
 */
export const publierProduit = (produitRequest) =>
  httpPost(BASE, '/api/produits/publier', produitRequest);

/** Update an existing product. Requires auth (must be the owner). */
export const modifierProduit = (id, produitRequest) =>
  httpPut(BASE, `/api/produits/${id}`, produitRequest);

/** Delete a product. Requires auth (must be the owner). */
export const supprimerProduit = (id) => httpDelete(BASE, `/api/produits/${id}`);

// ---- Catégories ----

export const getCategories = () => httpGet(BASE, '/api/categories', { auth: false });

export const getCategorieById = (id) => httpGet(BASE, `/api/categories/${id}`, { auth: false });

/** Create a category (admin use). { nom, description } */
export const creerCategorie = (categorieRequest) =>
  httpPost(BASE, '/api/categories', categorieRequest);

export const modifierCategorie = (id, categorieRequest) =>
  httpPut(BASE, `/api/categories/${id}`, categorieRequest);

export const supprimerCategorie = (id) => httpDelete(BASE, `/api/categories/${id}`);
