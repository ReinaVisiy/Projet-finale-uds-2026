package com.agrycam.paiementsimizservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entree principal du microservice de paiement Simiz d'AgryCam.
 */
@SpringBootApplication
public class PaiementSimizServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaiementSimizServiceApplication.class, args);
    }
}
