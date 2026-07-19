package com.agrycam.signalement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Classe principale de l'application Spring Boot pour le microservice de signalement.
 * Cette classe initialise et lance l'application.
 */
@SpringBootApplication
public class SignalementServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SignalementServiceApplication.class, args);
    }

}
