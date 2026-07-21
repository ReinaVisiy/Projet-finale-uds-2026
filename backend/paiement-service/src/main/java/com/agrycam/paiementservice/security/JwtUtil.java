package com.agrycam.paiementservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * Utilitaire pour la validation et l'extraction des informations des tokens JWT.
 * Le secret partage est utilise pour verifier l'authenticite du token.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object uidObj = claims.get("uid");
            if (uidObj instanceof Number) {
                return ((Number) uidObj).longValue();
            } else if (uidObj instanceof String) {
                return Long.parseLong((String) uidObj);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object rolesObj = claims.get("roles");
            if (rolesObj instanceof List) {
                return (List<String>) rolesObj;
            }
            return Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Genere un token JWT "de service" (courte duree de vie) signe avec le
     * meme secret partage que les autres microservices AgryCam.
     * Utilise par paiement-service pour s'authentifier lui-meme lorsqu'il
     * appelle certification-service ou commande-service en arriere-plan
     * (webhook NotchPay, verification asynchrone), contextes ou aucun token
     * utilisateur n'est disponible a propager.
     * uid=0 identifie conventionnellement un appel systeme (aucun
     * utilisateur reel ne porte cet identifiant).
     */
    public String genererTokenServiceInterne() {
        long maintenant = System.currentTimeMillis();
        long expiration = maintenant + 60_000; // 60 secondes : juste le temps de l'appel sortant

        return Jwts.builder()
                .claim("uid", 0L)
                .claim("roles", Collections.singletonList("ADMIN"))
                .issuedAt(new Date(maintenant))
                .expiration(new Date(expiration))
                .signWith(getSigningKey())
                .compact();
    }
}
