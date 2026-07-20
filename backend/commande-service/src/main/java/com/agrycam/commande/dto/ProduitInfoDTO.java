package com.agrycam.commande.dto;

import java.math.BigDecimal;

/**
 * DTO minimal pour lire les informations d'un produit depuis produit-service.
 * Ne contient que les champs nécessaires à la validation d'une commande.
 */
public class ProduitInfoDTO {

    private Long id;
    private String nom;
    private BigDecimal prix;
    private Integer stock;
    private Long producteurId;

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

    public BigDecimal getPrix() {
        return prix;
    }

    public void setPrix(BigDecimal prix) {
        this.prix = prix;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Long getProducteurId() {
        return producteurId;
    }

    public void setProducteurId(Long producteurId) {
        this.producteurId = producteurId;
    }
}
