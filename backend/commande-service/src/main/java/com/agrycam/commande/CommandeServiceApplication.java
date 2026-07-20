package com.agrycam.commande;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Classe principale de l'application Spring Boot pour le microservice de commande.
 * Cette classe initialise et lance l'application.
 */
@SpringBootApplication
@EnableScheduling
public class CommandeServiceApplication {



    

    public static void main(String[] args) {
        SpringApplication.run(CommandeServiceApplication.class, args);
    }

}
