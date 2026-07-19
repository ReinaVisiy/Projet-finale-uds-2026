package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

@Data
public class AjouterAdminRequest {
    private String nom;
    private String email;
    private String password;
}
