package com.agrycam.authservice.exception;

/**
 * Levee quand un compte existe et que le mot de passe est correct, mais
 * que l'email n'a pas encore ete confirme (cf. AuthService#login). Geree
 * separement de BadCredentialsException pour que le frontend puisse
 * distinguer ce cas (rediriger vers l'ecran de confirmation) d'un simple
 * mot de passe incorrect.
 */
public class EmailNonConfirmeException extends RuntimeException {
    public EmailNonConfirmeException(String message) {
        super(message);
    }
}
