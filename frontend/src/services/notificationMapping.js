// src/services/notificationMapping.js
//
// notification-service classe les notifications selon deux axes
// indépendants, stockés tous les deux en base :
// - "type" : le domaine métier (COMMANDE, PAIEMENT, CERTIFICATION,
//   MESSAGE, AVIS, SIGNALEMENT, COMPTE, SYSTEME)
// - "niveau" : la sévérité visuelle (INFO, SUCCES, AVERTISSEMENT, ERREUR)
//
// Le frontend (NotificationsCenter.jsx, NavigationConsole.jsx) a été
// conçu avant l'existence du backend et attend un format différent :
// utilisateurId, un "type" visuel en minuscules anglais
// (info | success | warning | error), un champ message unique, et
// dateCreation. Ce fichier fait le pont entre les deux, comme
// certificationMapping.js / commandeMapping.js le font pour leurs domaines.

// Sévérité UI (frontend, anglais/minuscules) <-> niveau backend (français/majuscules).
export const SEVERITE_UI_TO_BACKEND = {
  info: 'INFO',
  success: 'SUCCES',
  warning: 'AVERTISSEMENT',
  error: 'ERREUR',
};

export const SEVERITE_BACKEND_TO_UI = {
  INFO: 'info',
  SUCCES: 'success',
  AVERTISSEMENT: 'warning',
  ERREUR: 'error',
};

// Repli utilisé UNIQUEMENT pour les notifications créées avant l'ajout
// du champ "niveau" côté backend (donc sans niveau en base) : on
// approxime la sévérité à partir du domaine métier.
export const NOTIFICATION_TYPE_TO_SEVERITY = {
  COMMANDE: 'info',
  PAIEMENT: 'success',
  CERTIFICATION: 'info',
  MESSAGE: 'info',
  AVIS: 'info',
  SIGNALEMENT: 'warning',
  COMPTE: 'success',
  SYSTEME: 'info',
};

/**
 * Convertit une NotificationResponse (backend) en objet tel qu'attendu
 * par NotificationsCenter.jsx / NavigationConsole.jsx.
 */
export function mapNotificationPourAffichage(dto) {
  return {
    id: dto.id,
    utilisateurId: dto.destinataireId,
    type:
      SEVERITE_BACKEND_TO_UI[dto.niveau] ||
      NOTIFICATION_TYPE_TO_SEVERITY[dto.type] ||
      'info',
    typeMetier: dto.type, // conservé si besoin d'un filtrage plus fin plus tard
    message: dto.titre || dto.contenu,
    lien: dto.lien,
    lu: dto.lu,
    dateCreation: dto.dateEnvoi,
  };
}

/**
 * Devine le NotificationType métier (backend) à partir du lien de
 * redirection déjà utilisé partout dans App.jsx (ex. '/orders',
 * '/admin/moderation-panel', '/profil'...). Choisi pour éviter de
 * devoir modifier chacun des appels existants à addNotification :
 * c'est une heuristique, pas une garantie — à affiner avec Reina si
 * un cas ne tombe pas dans la bonne catégorie. (Ceci ne concerne que
 * le domaine métier ; la sévérité, elle, n'est plus devinée — voir
 * construireNotificationRequest ci-dessous.)
 */
export function deviserTypeMetier(lien) {
  if (!lien) return 'SYSTEME';
  if (lien.includes('order') || lien.includes('commande')) return 'COMMANDE';
  if (lien.includes('moderation') || lien.includes('signalement')) return 'SIGNALEMENT';
  if (lien.includes('certification')) return 'CERTIFICATION';
  if (lien.includes('message')) return 'MESSAGE';
  if (lien.includes('avis')) return 'AVIS';
  if (lien.includes('paiement')) return 'PAIEMENT';
  if (lien.includes('profil') || lien.includes('seller-dashboard') || lien.includes('admin/dashboard')) return 'COMPTE';
  return 'SYSTEME';
}

/**
 * Construit le NotificationRequest attendu par le backend à partir des
 * paramètres de addNotification(userId, uiType, message, lien).
 * uiType (info/success/warning/error) est la sévérité réellement
 * choisie par le développeur à chaque appel : on la transmet telle
 * quelle au backend au lieu de la redeviner à la lecture.
 */
export function construireNotificationRequest(destinataireId, message, lien, uiType) {
  return {
    destinataireId,
    type: deviserTypeMetier(lien),
    niveau: SEVERITE_UI_TO_BACKEND[uiType] || 'INFO',
    titre: message,
    contenu: message,
    lien: lien || null,
  };
}
