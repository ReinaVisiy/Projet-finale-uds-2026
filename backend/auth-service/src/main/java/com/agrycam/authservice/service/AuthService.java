package com.agrycam.authservice.service;

import com.agrycam.authservice.dto.IdentifiantsDTO;
import com.agrycam.authservice.dto.ConnexionRequest;
import com.agrycam.authservice.dto.ConnexionResponse;
import com.agrycam.authservice.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class AuthService {

    private final UtilisateurClient utilisateurClient;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UtilisateurClient utilisateurClient, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.utilisateurClient = utilisateurClient;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public ConnexionResponse login(ConnexionRequest request) {
        if (request.email() == null || request.password() == null) {
            throw new BadCredentialsException("L'email et le mot de passe sont requis");
        }

        IdentifiantsDTO credentials = utilisateurClient.getCredentialsByEmail(request.email());
        if (credentials == null) {
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        if (!passwordEncoder.matches(request.password(), credentials.passwordHash())) {
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        if (credentials.suspenduJusquau() != null && credentials.suspenduJusquau().isAfter(LocalDateTime.now())) {
            String dateFormatee = credentials.suspenduJusquau().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm"));
            throw new BadCredentialsException("Ce compte est suspendu jusqu'au " + dateFormatee + ".");
        }

        String token = jwtUtil.generateToken(credentials.uid(), credentials.email(), credentials.roles());

        return new ConnexionResponse(
            token,
            "Bearer",
            credentials.uid(),
            credentials.email(),
            credentials.roles()
        );
    }
}