package com.agriconnect.utilisateur_service.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "utilisateurs")
@Inheritance(strategy = InheritanceType.JOINED)
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    @Column(unique = true)
    private String email;

    private String adresse;

    private String motDePasse;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String telephone;

    @Column(columnDefinition = "TEXT")
    private String photo;

    // Abonnement du producteur ("gratuit" par defaut). Non utilise pour les clients/admins.
    private String plan = "gratuit";

    // Compte suspendu par un administrateur jusqu'à cette date (null =
    // pas suspendu). Vérifié par auth-service via /api/utilisateurs/credentials.
    // Un blocage "définitif" est juste une suspension avec une échéance
    // très lointaine — pas une fonctionnalité séparée.
    private java.time.LocalDateTime suspenduJusquau;

    public enum Role {
        CLIENT, PRODUCTEUR, ADMIN
    }
}