package com.agrycam.paiementservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration pour instancier RestTemplate, utilise pour les appels HTTP sortants
 * (API NotchPay notamment).
 *
 * Delais explicites : sans cela, RestTemplate n'a par defaut AUCUN timeout,
 * et un appel a NotchPay qui traine (sandbox lente, reseau) peut bloquer la
 * requete indefiniment. Cause racine du ticket "la verification de paiement
 * prend une eternite".
 */
@Configuration
public class RestTemplateConfig {

    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int READ_TIMEOUT_MS = 8000;

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }
}
