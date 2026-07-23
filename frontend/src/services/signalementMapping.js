// src/services/signalementMapping.js
//
// signalement-service ne stocke que des IDs (targetId, reporterId) et un
// seul champ texte `raison`, alors que ModerationPanel / AdminDashboard
// attendent des noms affichables (`cible`, `auteur`) et un statut en
// français minuscule. Ce fichier centralise cette conversion.

export const STATUT_BACKEND_TO_FRONTEND = {
  EN_ATTENTE: 'pending',
  EN_COURS_DE_TRAITEMENT: 'pending',
  RESOLU: 'résolu',
  REJETE: 'rejeté',
};

export const TYPE_FRONTEND_TO_BACKEND = {
  produit: 'PRODUIT',
  utilisateur: 'UTILISATEUR',
};

/**
 * Combine un motif (liste déroulante) et un commentaire libre en un seul
 * champ `raison`, car le backend n'a qu'un seul champ texte.
 */
export function construireRaison(motif, commentaire) {
  return commentaire ? `${motif} — ${commentaire}` : motif;
}

/**
 * Convertit un SignalementResponse (backend) + les noms déjà résolus de
 * la cible et de l'auteur en objet tel qu'attendu par ModerationPanel
 * et AdminDashboard : { id, cible, motif, auteur, date, status }.
 *
 * `targetOwnerId` est l'id du compte utilisateur à suspendre pour ce
 * signalement : pour un signalement "utilisateur" c'est directement
 * `dto.targetId` (client ou vendeur) ; pour un signalement "produit"
 * c'est l'id du vendeur propriétaire du produit (à fournir par
 * l'appelant, qui seul connaît la fiche produit).
 */
export function mapSignalementPourAffichage(dto, cibleNom, auteurNom, targetOwnerId) {
  return {
    id: dto.id,
    type: dto.type === 'PRODUIT' ? 'produit' : 'utilisateur',
    cible: cibleNom || `#${dto.targetId}`,
    targetId: dto.targetId,
    targetOwnerId: targetOwnerId ?? (dto.type !== 'PRODUIT' ? dto.targetId : undefined),
    reporterId: dto.reporterId, // déclarant à notifier une fois le signalement traité
    motif: dto.raison,
    auteur: auteurNom || `Utilisateur #${dto.reporterId}`,
    date: dto.dateCreation,
    status: STATUT_BACKEND_TO_FRONTEND[dto.statut] || 'pending',
  };
}
