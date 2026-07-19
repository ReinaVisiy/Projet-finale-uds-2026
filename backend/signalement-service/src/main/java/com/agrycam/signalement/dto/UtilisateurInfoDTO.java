package com.agrycam.signalement.dto;

/**
 * DTO minimal pour lire les informations d'un utilisateur depuis utilisateur-service.
 */
public class UtilisateurInfoDTO {

    private Long id;
    private String nom;
    private String role;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
