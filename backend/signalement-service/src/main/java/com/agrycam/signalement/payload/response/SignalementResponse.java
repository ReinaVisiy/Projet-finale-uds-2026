package com.agrycam.signalement.payload.response;

import com.agrycam.signalement.model.StatutSignalement;
import com.agrycam.signalement.model.TypeSignalement;
import java.time.LocalDateTime;

/**
 * DTO (Data Transfer Object) pour la réponse d'un signalement.
 * Contient les détails d'un signalement à retourner au client.
 */
public class SignalementResponse {
    private Long id;
    private TypeSignalement type;
    private Long targetId;
    private Long reporterId;
    private String raison;
    private StatutSignalement statut;
    private LocalDateTime dateCreation;
    private LocalDateTime dateResolution;
    private Long administrateurId;

    // Constructeur
    public SignalementResponse(Long id, TypeSignalement type, Long targetId, Long reporterId, String raison, StatutSignalement statut, LocalDateTime dateCreation, LocalDateTime dateResolution, Long administrateurId) {
        this.id = id;
        this.type = type;
        this.targetId = targetId;
        this.reporterId = reporterId;
        this.raison = raison;
        this.statut = statut;
        this.dateCreation = dateCreation;
        this.dateResolution = dateResolution;
        this.administrateurId = administrateurId;
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
