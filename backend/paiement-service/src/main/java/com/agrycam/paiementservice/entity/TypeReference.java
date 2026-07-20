package com.agrycam.paiementservice.entity;

/**
 * Types de reference pris en charge par le service de paiement.
 * Permet de gerer l'achat de produits (COMMANDE) ou les frais de certification (CERTIFICATION).
 */
public enum TypeReference {
    COMMANDE,
    CERTIFICATION
}
