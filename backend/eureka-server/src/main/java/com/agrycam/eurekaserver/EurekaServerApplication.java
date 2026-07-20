package com.agrycam.eurekaserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Classe principale d'activation du serveur Eureka pour le projet AGRYCAM.
 * Permet aux différents microservices (auth, utilisateur, produit, message, etc.)
 * de s'enregistrer et de communiquer de manière dynamique.
 */
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
