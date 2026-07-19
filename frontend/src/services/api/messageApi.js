// src/services/api/messageApi.js
// Maps to message-service (/api/messages) — port 8083 by default.

import { API_URLS } from './config';
import { httpGet, httpPost, httpPut, httpDelete } from './httpClient';

const BASE = API_URLS.message;

/** Send a message. request: { destinataireId, contenu } */
export const envoyerMessage = (messageRequest) =>
  httpPost(BASE, '/api/messages/envoyer', messageRequest);

/** Get the full conversation with another user. */
export const getConversation = (autreUserId) =>
  httpGet(BASE, `/api/messages/conversation/${autreUserId}`);

/** Get all of the logged-in user's messages (across all conversations). */
export const getMesMessages = () => httpGet(BASE, '/api/messages/mes-messages');

/** Mark a message as read. */
export const marquerLu = (messageId) => httpPut(BASE, `/api/messages/lire/${messageId}`);

/** Count unread messages for the logged-in user. */
export const compterNonLus = () => httpGet(BASE, '/api/messages/non-lus');

/** Delete an entire conversation with another user. */
export const supprimerConversation = (autreUserId) =>
  httpDelete(BASE, `/api/messages/conversation/${autreUserId}`);
