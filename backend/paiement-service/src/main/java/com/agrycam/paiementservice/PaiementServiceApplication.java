package com.agrycam.paiementservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entree principal du microservice de paiement NotchPay d'AgryCam.
 */
@SpringBootApplication
public class PaiementServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaiementServiceApplication.class, args);
    }
}
