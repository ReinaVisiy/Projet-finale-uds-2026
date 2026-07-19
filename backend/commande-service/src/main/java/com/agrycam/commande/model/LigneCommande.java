package com.agrycam.commande.model;

import jakarta.persistence.*;

/**
 * Entité représentant une ligne de commande, détaillant un produit et sa quantité au sein d'une commande.
 */
@Entity
@Table(name = "lignes_commande")
public class LigneCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    // ID du produit (référence à un produit d'un autre microservice, ex: microservice produit)
    private Long produitId;

    private int quantite;

    private double prixUnitaire;

    // Constructeurs
    public LigneCommande() {
    }

    public LigneCommande(Commande commande, Long produitId, int quantite, double prixUnitaire) {
        this.commande = commande;
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

    public Commande getCommande() {
        return commande;
    }

    public void setCommande(Commande commande) {
        this.commande = commande;
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
