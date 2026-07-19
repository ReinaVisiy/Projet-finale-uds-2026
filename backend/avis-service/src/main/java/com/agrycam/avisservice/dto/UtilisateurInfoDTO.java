package com.agrycam.avisservice.dto;

public class UtilisateurInfoDTO {
    private Long id;
    private String nom;
    private String email;
    private String adresse;
    private String role;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}