package com.agrycam.commande.payload.response;

/**
 * DTO (Data Transfer Object) pour la réponse d'une ligne de commande.
 * Contient les détails d'une ligne de commande à retourner au client.
 */
public class LigneCommandeResponse {
    private Long id;
    private Long produitId;
    private int quantite;
    private double prixUnitaire;

    // Constructeur
    public LigneCommandeResponse(Long id, Long produitId, int quantite, double prixUnitaire) {
        this.id = id;
        this.produitId = produitId;
        this.quantite = quantite;
        this.prixUnitaire = prixUnitaire;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
