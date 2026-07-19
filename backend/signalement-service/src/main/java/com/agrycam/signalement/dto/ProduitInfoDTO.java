package com.agrycam.signalement.dto;

/**
 * DTO minimal pour lire les informations d'un produit depuis produit-service.
 */
public class ProduitInfoDTO {

    private Long id;
    private String nom;

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
}
