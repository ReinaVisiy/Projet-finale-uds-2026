package com.agrycam.commande.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant une commande dans le système AGRYCAM.
 * Une commande est associée à un client, a un statut, une date de création et contient plusieurs lignes de commande.
 */
@Entity
@Table(name = "commandes")
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID du client qui a passé la commande (référence à un utilisateur du microservice utilisateur-service, via auth-service)
    private Long clientId;

    // ID du producteur/vendeur propriétaire de CETTE commande. Un panier
    // multi-vendeurs est désormais scindé en plusieurs commandes côté
    // frontend (une par vendeur) : chaque Commande n'a donc plus qu'un seul
    // vendeur, ce qui permet des actions et un statut indépendants par
    // vendeur (valider/préparer/expédier sa propre commande uniquement).
    private Long producteurId;

    @Enumerated(EnumType.STRING)
    private StatutCommande statut;

    private LocalDateTime dateCommande;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneCommande> lignesCommande = new ArrayList<>();

    // Constructeurs
    public Commande() {
        this.dateCommande = LocalDateTime.now();
        this.statut = StatutCommande.EN_ATTENTE;
    }

    public Commande(Long clientId) {
        this();
        this.clientId = clientId;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public Long getProducteurId() {
        return producteurId;
    }

    public void setProducteurId(Long producteurId) {
        this.producteurId = producteurId;
    }

    public StatutCommande getStatut() {
        return statut;
    }

    public void setStatut(StatutCommande statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateCommande() {
        return dateCommande;
    }

    public void setDateCommande(LocalDateTime dateCommande) {
        this.dateCommande = dateCommande;
    }

    public List<LigneCommande> getLignesCommande() {
        return lignesCommande;
    }

    public void setLignesCommande(List<LigneCommande> lignesCommande) {
        this.lignesCommande = lignesCommande;
    }

    public void addLigneCommande(LigneCommande ligneCommande) {
        this.lignesCommande.add(ligneCommande);
        ligneCommande.setCommande(this);
    }

    public void removeLigneCommande(LigneCommande ligneCommande) {
        this.lignesCommande.remove(ligneCommande);
        ligneCommande.setCommande(null);
    }
}
