package com.agrycam.signalement.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Gestionnaire global des exceptions pour signalement-service.
 * Transforme les erreurs de validation en réponses HTTP claires plutôt qu'en erreur 500 générique.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Erreur inattendue";

        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (message.toLowerCase().contains("introuvable")) {
            status = HttpStatus.NOT_FOUND;
        }

        return ResponseEntity.status(status).body(Map.of("erreur", message));
    }
}
