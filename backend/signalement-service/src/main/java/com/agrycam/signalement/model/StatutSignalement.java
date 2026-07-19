package com.agrycam.signalement.model;

/**
 * Énumération des statuts possibles pour un signalement.
 * EN_ATTENTE: Le signalement vient d'être créé et n'a pas encore été traité.
 * EN_COURS_DE_TRAITEMENT: Un administrateur a pris en charge le signalement.
 * RESOLU: Le signalement a été traité et une action a été prise (ex: suppression de contenu, avertissement).
 * REJETE: Le signalement a été examiné et jugé non fondé.
 */
public enum StatutSignalement {
    EN_ATTENTE,
    EN_COURS_DE_TRAITEMENT,
    RESOLU,
    REJETE
}
