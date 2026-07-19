package com.agrimarket.paiement_service.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Configuration Feign qui propage le token JWT de la requête HTTP entrante
 * vers les appels sortants effectués via les FeignClient (commande-service, utilisateur-service).
 * Permet à un endpoint interne de devenir protégé un jour sans casser
 * la communication inter-services.
 */
@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor jwtPropagationInterceptor() {
        return (RequestTemplate template) -> {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest requeteEntrante = attributes.getRequest();
                String authorization = requeteEntrante.getHeader("Authorization");
                if (authorization != null && !template.headers().containsKey("Authorization")) {
                    template.header("Authorization", authorization);
                }
            }
        };
    }
}
