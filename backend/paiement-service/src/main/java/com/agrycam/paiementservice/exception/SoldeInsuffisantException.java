package com.agrycam.paiementservice.exception;

/**
 * Exception levee lorsque le solde d'un vendeur est insuffisant pour effectuer un retrait.
 */
public class SoldeInsuffisantException extends RuntimeException {
    public SoldeInsuffisantException(String message) {
        super(message);
    }
}
