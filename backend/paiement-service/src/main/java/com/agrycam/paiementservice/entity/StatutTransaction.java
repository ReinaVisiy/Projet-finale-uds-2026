package com.agrycam.paiementservice.entity;

/**
 * Statuts possibles pour une transaction de paiement.
 */
public enum StatutTransaction {
    EN_ATTENTE,
    PAYE,
    ECHOUE,
    EXPIRE
}
