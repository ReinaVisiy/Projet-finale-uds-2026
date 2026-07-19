package com.agrycam.authservice.controller;

import com.agrycam.authservice.dto.ConnexionRequest;
import com.agrycam.authservice.dto.ConnexionResponse;
import com.agrycam.authservice.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/connexion")
    public ResponseEntity<ConnexionResponse> connexion(@RequestBody ConnexionRequest connexionRequest) {
        ConnexionResponse response = authService.login(connexionRequest);
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(Map.of(
                "status", "401",
                "error", "Unauthorized",
                "message", ex.getMessage()
            ));
    }
}