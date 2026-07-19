// src/services/api/notificationApi.js
// Correspond à notification-service (/api/notifications) — port 8089 par défaut.
// Toutes les routes exigent un JWT valide (aucune route publique côté backend).

import { API_URLS } from './config';
import { httpGet, httpPost, httpPut, httpDelete } from './httpClient';

const BASE = API_URLS.notification;

/**
 * Crée une notification pour un destinataire donné.
 * request: { destinataireId, type, titre, contenu, lien }
 * type doit être une valeur de NotificationType côté backend :
 * COMMANDE | PAIEMENT | CERTIFICATION | MESSAGE | AVIS | SIGNALEMENT | COMPTE | SYSTEME
 */
export const creerNotification = (notificationRequest) =>
  httpPost(BASE, '/api/notifications', notificationRequest);

/** Récupère les notifications de l'utilisateur connecté (déduit du JWT). */
export const getMesNotifications = () =>
  httpGet(BASE, '/api/notifications/mes-notifications');

/** Nombre de notifications non lues de l'utilisateur connecté. */
export const getNonLuesCompteur = () =>
  httpGet(BASE, '/api/notifications/non-lues/compteur');

/** Marque une notification comme lue (doit appartenir à l'utilisateur, ou être admin). */
export const marquerCommeLu = (id) =>
  httpPut(BASE, `/api/notifications/${id}/lu`, null);

/** Marque toutes les notifications de l'utilisateur connecté comme lues. */
export const marquerToutesLues = () =>
  httpPut(BASE, '/api/notifications/marquer-toutes-lues', null);

/** Supprime une notification (doit appartenir à l'utilisateur, ou être admin). */
export const supprimerNotification = (id) =>
  httpDelete(BASE, `/api/notifications/${id}`);

/** Liste complète des notifications, réservée au rôle ADMIN. */
export const getToutesNotifications = () =>
  httpGet(BASE, '/api/notifications');
