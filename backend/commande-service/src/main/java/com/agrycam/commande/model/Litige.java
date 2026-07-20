package com.agrycam.commande.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Entite representant un litige ouvert par un client sur une commande
 * (produit non livre, endommage, qualite, quantite...). Rattachee a
 * commande-service (plutot qu'a paiement-service) car elle est avant
 * tout scopee a la commande ; le remboursement eventuel qu'elle
 * declenche est delegue a paiement-service via PaiementServiceClient.
 */
@Entity
@Table(name = "litiges")
public class Litige {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "commande_id", nullable = false)
    private Long commandeId;

    // ID du client qui a ouvert le litige (doit etre le proprietaire de
    // la commande, verifie a la creation).
    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeLitige type;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutLitige statut;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_resolution")
    private LocalDateTime dateResolution;

    public Litige() {
        this.dateCreation = LocalDateTime.now();
        this.statut = StatutLitige.OUVERT;
    }

    public Litige(Long commandeId, Long clientId, TypeLitige type, String description) {
        this();
        this.commandeId = commandeId;
        this.clientId = clientId;
        this.type = type;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCommandeId() {
        return commandeId;
    }

    public void setCommandeId(Long commandeId) {
        this.commandeId = commandeId;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public TypeLitige getType() {
        return type;
    }

    public void setType(TypeLitige type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public StatutLitige getStatut() {
        return statut;
    }

    public void setStatut(StatutLitige statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public LocalDateTime getDateResolution() {
        return dateResolution;
    }

    public void setDateResolution(LocalDateTime dateResolution) {
        this.dateResolution = dateResolution;
    }
}
