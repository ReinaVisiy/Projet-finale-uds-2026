// src/services/api/litigeApi.js
// Correspond a commande-service (/api/litiges) — module Litige (etape 8).
//
// Un litige est ouvert par un client sur une commande. Le type
// PRODUIT_NON_LIVRE beneficie d'un remboursement en un clic tant que les
// fonds ne sont pas deja liberes vers le solde disponible du vendeur
// (flag `fondsDejaRetires` calcule cote backend). Les autres types
// (PRODUIT_ENDOMMAGE, QUALITE_INSUFFISANTE, QUANTITE_INCORRECTE, AUTRE)
// sont traites manuellement par l'admin, sans reversement automatique.

import { API_URLS } from './config';
import { httpGet, httpPost, httpPut } from './httpClient';

const BASE = API_URLS.commande;

/** Types de litige possibles (miroir de TypeLitige côté backend). */
export const TYPES_LITIGE = {
  PRODUIT_NON_LIVRE: 'PRODUIT_NON_LIVRE',
  PRODUIT_ENDOMMAGE: 'PRODUIT_ENDOMMAGE',
  QUALITE_INSUFFISANTE: 'QUALITE_INSUFFISANTE',
  QUANTITE_INCORRECTE: 'QUANTITE_INCORRECTE',
  AUTRE: 'AUTRE',
};

/** Statuts possibles d'un litige (miroir de StatutLitige côté backend). */
export const STATUTS_LITIGE = {
  OUVERT: 'OUVERT',
  RESOLU: 'RESOLU',
  REJETE: 'REJETE',
};

/**
 * Ouvre un litige sur une commande (rôle client).
 * dto: { commandeId, type, description }
 */
export const creerLitige = (dto) => httpPost(BASE, '/api/litiges', dto);

/** Liste tous les litiges de la plateforme (rôle admin). */
export const getTousLesLitiges = () => httpGet(BASE, '/api/litiges');

/** Liste les litiges ouverts par le client connecté (rôle client). */
export const getMesLitiges = () => httpGet(BASE, '/api/litiges/mes-litiges');

/**
 * Rembourse intégralement un litige "Produit non livré" en un clic
 * (rôle admin). Echoue si les fonds ont déjà été retirés par le vendeur.
 */
export const rembourserLitige = (litigeId) =>
  httpPut(BASE, `/api/litiges/${litigeId}/rembourser`, undefined);

/**
 * Résolution manuelle d'un litige (rôle admin), sans mouvement financier
 * automatique — pour les types autres que "Produit non livré", ou le
 * rejet d'un litige non fondé. statut: 'RESOLU' | 'REJETE'.
 */
export const resoudreLitige = (litigeId, statut) =>
  httpPut(BASE, `/api/litiges/${litigeId}/statut?statut=${statut}`, undefined);
