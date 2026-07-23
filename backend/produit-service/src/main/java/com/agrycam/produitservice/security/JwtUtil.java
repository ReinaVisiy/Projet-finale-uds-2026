package com.agrycam.produitservice.security;

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

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
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

    /**
     * Genere un token de courte duree (60s) representant un appel systeme
     * (uid=0, role ADMIN), pour authentifier les appels sortants de
     * produit-service vers d'autres services (ex. notification-service),
     * hors de tout contexte de requete utilisateur.
     */
    public String genererTokenServiceInterne() {
        long maintenant = System.currentTimeMillis();
        long expiration = maintenant + 60_000;

        return Jwts.builder()
                .claim("uid", 0L)
                .claim("roles", Collections.singletonList("ADMIN"))
                .setIssuedAt(new Date(maintenant))
                .setExpiration(new Date(expiration))
                .signWith(getSigningKey())
                .compact();
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
