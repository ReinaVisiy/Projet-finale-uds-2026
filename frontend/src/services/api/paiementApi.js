// src/services/api/paiementApi.js
// Correspond a paiement-service (/api/paiements) — port 8087 par defaut.
// Depuis le passage a la passerelle de paiement NotchPay, ce service ne
// fonctionne plus par simple creation/mise a jour d'un "Paiement" : il
// initie une session de paiement NotchPay, puis expose sa verification.

import { API_URLS } from './config';
import { httpGet, httpPost } from './httpClient';

const BASE = API_URLS.paiement;

/**
 * Initie un paiement (role client).
 * dto: { typeReference: 'COMMANDE' | 'CERTIFICATION', referenceId, vendeurId, montant }
 * Renvoie la Transaction créée, avec l'URL de checkout NotchPay
 * (transaction.notchpayCheckoutUrl) vers laquelle rediriger le client.
 */
export const initierPaiement = (dto) => httpPost(BASE, '/api/paiements/initier', dto);

/**
 * Sonde le statut d'une transaction aupres de NotchPay et met à jour son
 * statut en base. A appeler depuis l'écran de retour (successUrl/cancelUrl)
 * une fois le client redirigé depuis NotchPay.
 */
export const verifierPaiement = (transactionId) =>
  httpGet(BASE, `/api/paiements/${transactionId}/verifier`);

/**
 * Consulte l'état de paiement d'une commande ou d'une certification
 * (endpoint public utilisé aussi par les autres microservices).
 */
export const getStatutReference = (typeReference, referenceId) =>
  httpGet(BASE, `/api/paiements/statut/${typeReference}/${referenceId}`);

/** Solde actuel du portefeuille du vendeur connecté (rôle vendeur). */
export const getMonSolde = () => httpGet(BASE, '/api/paiements/mon-solde');

/** Historique des transactions du vendeur connecté (rôle vendeur). */
export const getMesTransactions = () => httpGet(BASE, '/api/paiements/mes-transactions');

/** Demande de retrait de fonds (rôle vendeur). montant: number. */
export const demanderRetrait = (montant) => httpPost(BASE, '/api/paiements/retrait', { montant });

/** Historique des retraits du vendeur connecté (rôle vendeur). */
export const getMesRetraits = () => httpGet(BASE, '/api/paiements/mes-retraits');

/** Liste de toutes les transactions de la plateforme (rôle admin). */
export const getToutesTransactionsAdmin = () => httpGet(BASE, '/api/paiements/admin/toutes-transactions');
