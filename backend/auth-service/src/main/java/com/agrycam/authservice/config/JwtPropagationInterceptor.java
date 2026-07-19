package com.agrycam.authservice.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;

/**
 * Intercepteur RestTemplate qui propage le token JWT de la requête HTTP entrante
 * vers les appels sortants effectués vers les autres microservices.
 * Permet à un endpoint interne de devenir protégé un jour sans casser
 * la communication inter-services.
 */
public class JwtPropagationInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest requeteEntrante = attributes.getRequest();
            String authorization = requeteEntrante.getHeader("Authorization");
            if (authorization != null && !request.getHeaders().containsKey("Authorization")) {
                request.getHeaders().add("Authorization", authorization);
            }
        }
        return execution.execute(request, body);
    }
}
