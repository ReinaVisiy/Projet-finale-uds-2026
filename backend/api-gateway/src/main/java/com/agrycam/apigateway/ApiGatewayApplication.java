package com.agrycam.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée unique du frontend AGRYCAM vers les microservices.
 * Chaque requête /api/xxx/** est routée vers le bon service en le
 * cherchant dans eureka-server (voir application.properties et
 * CorsConfig).
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
