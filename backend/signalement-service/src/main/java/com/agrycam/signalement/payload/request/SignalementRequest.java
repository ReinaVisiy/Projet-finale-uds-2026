package com.agrycam.signalement.payload.request;

import com.agrycam.signalement.model.TypeSignalement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO (Data Transfer Object) pour la requête de création d'un nouveau signalement.
 * Contient le type de signalement, l'ID de la cible, l'ID de l'utilisateur qui signale et la raison.
 */
public class SignalementRequest {

    @NotNull(message = "Le type de signalement ne peut pas être nul")
    private TypeSignalement type;

    @NotNull(message = "L'ID de la cible ne peut pas être nul")
    private Long targetId;

    @NotNull(message = "L'ID de l'utilisateur qui signale ne peut pas être nul")
    private Long reporterId;

    @NotBlank(message = "La raison du signalement ne peut pas être vide")
    private String raison;

    // Getters et Setters
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
}
