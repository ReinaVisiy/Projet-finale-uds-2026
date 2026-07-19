package com.agrycam.notificationservice.entity;

/**
 * Niveau de gravité visuelle d'une notification (utilisé côté frontend
 * pour l'icône/la couleur/les onglets), distinct de NotificationType qui
 * représente le domaine métier (commande, paiement, etc.).
 */
public enum NotificationSeverity {
    INFO,
    SUCCES,
    AVERTISSEMENT,
    ERREUR
}
