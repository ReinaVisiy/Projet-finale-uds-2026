package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

@Data
public class UtilisateurDTO {
    private Long id;
    private String nom;
    private String email;
    private String adresse;
    private String role;
    private String telephone;
    private String photo;
    private String plan;
    private java.time.LocalDateTime suspenduJusquau;
    // Pratique pour le frontend : évite de comparer des dates côté client.
    private boolean suspendu;
    private boolean emailConfirme;
}