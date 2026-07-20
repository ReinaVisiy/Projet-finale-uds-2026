package com.agrycam.commande.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * Utilitaire de validation et de lecture des tokens JWT.
 * Utilise le même secret partagé que auth-service.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public Long extractUid(String token) {
        Object uidObj = getClaims(token).get("uid");
        if (uidObj instanceof Number) {
            return ((Number) uidObj).longValue();
        } else if (uidObj instanceof String) {
            try {
                return Long.parseLong((String) uidObj);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return getClaims(token).get("roles", List.class);
    }

    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Genere un token JWT "de service" (courte duree de vie), identique
     * dans son principe a celui de paiement-service : utilise par
     * commande-service pour s'authentifier lui-meme lorsqu'il notifie
     * paiement-service en arriere-plan (ex. liberation du sequestre a la
     * livraison), sans requete utilisateur dont on pourrait propager le token.
     */
    public String genererTokenServiceInterne() {
        long maintenant = System.currentTimeMillis();
        long expiration = maintenant + 60_000; // 60 secondes : juste le temps de l'appel sortant

        return Jwts.builder()
                .claim("uid", 0L)
                .claim("roles", Collections.singletonList("ADMIN"))
                .setIssuedAt(new Date(maintenant))
                .setExpiration(new Date(expiration))
                .signWith(getSigningKey())
                .compact();
    }
}
