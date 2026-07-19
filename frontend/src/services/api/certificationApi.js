// src/services/api/certificationApi.js
// Maps to certification-service (/api/certifications) — port 8086 by default.

import { API_URLS } from './config';
import { httpGet, httpPut, httpPost } from './httpClient';

const BASE = API_URLS.certification;

/** Submit a certification request (producer). */
export const soumettreCertification = (certificationRequest) =>
  httpPost(BASE, '/api/certifications/soumettre', certificationRequest);

/** Get the logged-in producer's own certifications. */
export const getMesCertifications = () => httpGet(BASE, '/api/certifications/mes-certifications');

export const getCertificationById = (id) => httpGet(BASE, `/api/certifications/${id}`);

/** Check whether a given producer currently has an active certification. Public. */
export const estCertifieActif = (producteurId) =>
  httpGet(BASE, `/api/certifications/statut-actif/${producteurId}`, { auth: false });

/** Get the available payment methods/numbers for certification fees. Public. */
export const getPaymentInformation = () =>
  httpGet(BASE, '/api/certifications/payment-information', { auth: false });

// ---- Admin only ----

/** List certifications pending review. Requires ADMIN role. */
export const getCertificationsEnAttente = () => httpGet(BASE, '/api/certifications/admin/en-attente');

/** Confirm payment for a certification request. Requires ADMIN role. */
export const confirmerPaiementCertification = (id, paymentConfirmation) =>
  httpPut(BASE, `/api/certifications/admin/${id}/paiement`, paymentConfirmation);

/** Approve/reject a certification request. Requires ADMIN role. */
export const reviserCertification = (id, reviewRequest) =>
  httpPut(BASE, `/api/certifications/admin/${id}/reviser`, reviewRequest);
