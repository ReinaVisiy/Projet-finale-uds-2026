package com.agrycam.paiementservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filtre d'authentification JWT executé à chaque requete.
 * Extrait le uid (identifiant unique de l'utilisateur) et ses roles pour configurer le contexte de securite Spring Security.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                Long uid = jwtUtil.extractUid(token);
                List<String> roles = jwtUtil.extractRoles(token);
                
                if (uid != null) {
                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(role -> {
                                String prefixedRole = role.toUpperCase();
                                if (!prefixedRole.startsWith("ROLE_")) {
                                    prefixedRole = "ROLE_" + prefixedRole;
                                }
                                return new SimpleGrantedAuthority(prefixedRole);
                            })
                            .collect(Collectors.toList());
                    
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            uid, null, authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
