// src/services/api/index.js
// Central entry point for all backend calls.
// Usage: import { authApi, produitApi } from '../services/api';
//        await authApi.login(email, password);

export * as authApi from './authApi';
export * as utilisateurApi from './utilisateurApi';
export * as produitApi from './produitApi';
export * as commandeApi from './commandeApi';
export * as paiementApi from './paiementApi';
export * as messageApi from './messageApi';
export * as avisApi from './avisApi';
export * as certificationApi from './certificationApi';
export * as signalementApi from './signalementApi';
export * as notificationApi from './notificationApi';

export { getSession, isAuthenticated, hasRole, clearSession } from './authSession';
export { ApiError } from './httpClient';
