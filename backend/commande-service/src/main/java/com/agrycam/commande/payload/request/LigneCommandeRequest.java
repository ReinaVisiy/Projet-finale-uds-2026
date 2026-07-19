package com.agrycam.commande.payload.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO (Data Transfer Object) pour la création d'une nouvelle ligne de commande.
 * Contient l'ID du produit, la quantité et le prix unitaire.
 */
public class LigneCommandeRequest {

    @NotNull(message = "L'ID du produit ne peut pas être nul")
    private Long produitId;

    @Min(value = 1, message = "La quantité doit être au moins de 1")
    private int quantite;

    @Min(value = 0, message = "Le prix unitaire ne peut pas être négatif")
    private double prixUnitaire;

    // Getters et Setters
    public Long getProduitId() {
        return produitId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public double getPrixUnitaire() {
        return prixUnitaire;
    }

    public void setPrixUnitaire(double prixUnitaire) {
        this.prixUnitaire = prixUnitaire;
    }
}
