package com.agrycam.authservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Gestionnaire global des exceptions pour auth-service.
 * Transforme les erreurs de validation en réponses HTTP claires
 * (JSON) plutôt qu'en page d'erreur Spring "Whitelabel" / 500 générique.
 *
 * Note : AuthController garde son propre @ExceptionHandler pour ses cas
 * spécifiques (identifiants invalides) ; celui-ci sert de filet de
 * sécurité pour tout le reste du service.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Erreur inattendue";

        HttpStatus status = HttpStatus.BAD_REQUEST;
        String lower = message.toLowerCase();
        if (lower.contains("introuvable") || lower.contains("non trouv")) {
            status = HttpStatus.NOT_FOUND;
        }

        return ResponseEntity.status(status).body(Map.of("erreur", message));
    }
}
