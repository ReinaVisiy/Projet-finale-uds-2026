package com.agrycam.paiementservice.exception;

/**
 * Exception levee lorsqu'une transaction est introuvable.
 */
public class TransactionNotFoundException extends RuntimeException {
    public TransactionNotFoundException(String message) {
        super(message);
    }
}
