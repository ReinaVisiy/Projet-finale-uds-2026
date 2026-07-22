package com.agrycam.paiementservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Gestionnaire global des exceptions pour renvoyer les erreurs au format specifie : {"erreur": "message"}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Refus d'acces (@PreAuthorize) : renvoie un 403 propre avec un message
     * exploitable cote frontend, plutot que de laisser tomber dans le
     * handler generique ci-dessous (qui renverrait un 500 "Access Denied"
     * trompeur, comme si le serveur avait plante).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("erreur", "Vous n'avez pas les droits necessaires pour effectuer cette action."));
    }

    @ExceptionHandler(SoldeInsuffisantException.class)
    public ResponseEntity<Map<String, String>> handleSoldeInsuffisant(SoldeInsuffisantException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erreur", ex.getMessage()));
    }

    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleTransactionNotFound(TransactionNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("erreur", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erreur", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erreur", "Une erreur interne est survenue : " + ex.getMessage()));
    }
}
