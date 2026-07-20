package com.agrycam.authservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

/**
 * Utility class for JSON Web Token (JWT) generation, validation, and parsing.
 * Adheres to JJWT 0.12.x modern builder and parser patterns.
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration-ms}") long expirationMs
    ) {
        // Build the SecretKey using HMAC-SHA key generator from UTF-8 bytes.
        // jwt.secret comes from the JWT_SECRET environment variable (no default —
        // see README). It must be at least 32 bytes (256 bits) to meet the HS256
        // minimum key length requirement.
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Generates a secure JWT token containing uid, email, and roles claims.
     */
    public String generateToken(Long uid, String email, List<String> roles) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
            .subject(email) // standard sub claim can store the email
            .claim("uid", uid)
            .claim("email", email)
            .claim("roles", roles)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact();
    }

    /**
     * Validates the given JWT token and returns whether it is in a valid state.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            // Token is expired, malformed, unsupported, or has an invalid signature
            return false;
        }
    }

    /**
     * Extracts all claims from the JWT.
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    /**
     * Safely extracts the uid claim as a Long.
     */
    public Long extractUid(String token) {
        Claims claims = extractAllClaims(token);
        Object uidValue = claims.get("uid");
        if (uidValue instanceof Number) {
            return ((Number) uidValue).longValue();
        }
        return null;
    }

    /**
     * Extracts the email claim.
     */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extracts the roles claim as a list.
     */
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("roles", List.class);
    }
}
