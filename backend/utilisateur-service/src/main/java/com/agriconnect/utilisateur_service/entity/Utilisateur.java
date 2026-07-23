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

    // Ville/commune du compte (producteur ou client), affichee sur les
    // fiches produit ("Disponible a : ...") et utilisee pour le filtre
    // de recherche par localisation. Distincte de "adresse" (adresse
    // postale complete, non utilisee aujourd'hui) : un simple nom de
    // ville, facultatif.
    private String ville;

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

    // Confirmation d'email a l'inscription (cf. UtilisateurService#createUtilisateur
    // et #confirmerEmail) : un compte nouvellement cree n'est pas connectable
    // (verifie par auth-service, cf. AuthService#login) tant que le code envoye
    // par email n'a pas ete valide. Les comptes admin (AdminSeeder,
    // creerAdministrateur) sont crees deja confirmes.
    private boolean emailConfirme = false;
    private String codeConfirmationEmail;
    private java.time.LocalDateTime expirationCodeConfirmation;

    // Reinitialisation de mot de passe ("mot de passe oublie", cf.
    // UtilisateurService#demanderReinitialisationMotDePasse /
    // #reinitialiserMotDePasse) : code a usage unique envoye par email,
    // valable une duree limitee.
    private String codeReinitialisationMdp;
    private java.time.LocalDateTime expirationCodeReinitialisation;

    public enum Role {
        CLIENT, PRODUCTEUR, ADMIN
    }
}