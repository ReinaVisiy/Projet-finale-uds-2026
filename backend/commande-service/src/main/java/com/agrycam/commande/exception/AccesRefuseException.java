package com.agrycam.commande.exception;

/**
 * Levée lorsqu'un utilisateur authentifié tente une transition de statut
 * de commande pour laquelle il n'a pas le rôle requis, ou qu'il n'est pas
 * le vendeur/client propriétaire de la commande concernée.
 * Distincte d'une simple RuntimeException (400) pour renvoyer un 403.
 */
public class AccesRefuseException extends RuntimeException {
    public AccesRefuseException(String message) {
        super(message);
    }
}
