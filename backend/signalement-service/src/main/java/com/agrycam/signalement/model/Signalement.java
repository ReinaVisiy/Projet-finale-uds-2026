package com.agrycam.signalement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité représentant un signalement dans le système AGRYCAM.
 * Un signalement peut concerner un produit ou un utilisateur, et a un statut qui évolue.
 */
@Entity
@Table(name = "signalements")
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeSignalement type;

    @Column(nullable = false)
    private Long targetId; // ID du produit ou de l'utilisateur signalé

    @Column(nullable = false)
    private Long reporterId; // ID de l'utilisateur qui a fait le signalement

    @Column(columnDefinition = "TEXT")
    private String raison;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutSignalement statut;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateResolution;

    private Long administrateurId; // ID de l'administrateur qui a traité le signalement

    // Constructeurs
    public Signalement() {
        this.dateCreation = LocalDateTime.now();
        this.statut = StatutSignalement.EN_ATTENTE;
    }

    public Signalement(TypeSignalement type, Long targetId, Long reporterId, String raison) {
        this();
        this.type = type;
        this.targetId = targetId;
        this.reporterId = reporterId;
        this.raison = raison;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TypeSignalement getType() {
        return type;
    }

    public void setType(TypeSignalement type) {
        this.type = type;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public Long getReporterId() {
        return reporterId;
    }

    public void setReporterId(Long reporterId) {
        this.reporterId = reporterId;
    }

    public String getRaison() {
        return raison;
    }

    public void setRaison(String raison) {
        this.raison = raison;
    }

    public StatutSignalement getStatut() {
        return statut;
    }

    public void setStatut(StatutSignalement statut) {
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

    public Long getAdministrateurId() {
        return administrateurId;
    }

    public void setAdministrateurId(Long administrateurId) {
        this.administrateurId = administrateurId;
    }
}
