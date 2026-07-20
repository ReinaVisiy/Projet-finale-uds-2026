package com.agrycam.paiementservice.entity;

/**
 * Statuts possibles pour une transaction de paiement.
 */
public enum StatutTransaction {
    EN_ATTENTE,
    PAYE,
    ECHOUE,
    EXPIRE,
    REMBOURSEE // commande annulee avant expedition : 90% rembourse au client, 10% retenu par la plateforme
}
