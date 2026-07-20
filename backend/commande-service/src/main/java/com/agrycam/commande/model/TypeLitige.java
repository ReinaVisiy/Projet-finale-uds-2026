package com.agrycam.commande.model;

/**
 * Type d'un litige ouvert par un client sur une commande.
 * PRODUIT_NON_LIVRE beneficie d'un remboursement automatique en un clic
 * (cf. LitigeService#rembourserLitige) tant que les fonds ne sont pas
 * deja liberes vers le solde disponible du vendeur. Les autres types
 * sont traites manuellement par l'admin (echange de preuves), sans
 * reversement financier automatique.
 */
public enum TypeLitige {
    PRODUIT_NON_LIVRE,
    PRODUIT_ENDOMMAGE,
    QUALITE_INSUFFISANTE,
    QUANTITE_INCORRECTE,
    AUTRE
}
