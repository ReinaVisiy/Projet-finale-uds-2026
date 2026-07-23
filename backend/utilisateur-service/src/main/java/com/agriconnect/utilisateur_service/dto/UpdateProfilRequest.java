package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

@Data
public class UpdateProfilRequest {
    private String nom;
    private String adresse;
    private String ville;
    private String email;
    private String telephone;
    private String photo;
    private String plan;
}