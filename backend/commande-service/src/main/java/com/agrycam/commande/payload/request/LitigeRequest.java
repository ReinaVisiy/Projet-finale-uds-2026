package com.agrycam.commande.payload.request;

import com.agrycam.commande.model.TypeLitige;
import jakarta.validation.constraints.NotNull;

public class LitigeRequest {

    @NotNull
    private Long commandeId;

    @NotNull
    private TypeLitige type;

    private String description;

    public Long getCommandeId() {
        return commandeId;
    }

    public void setCommandeId(Long commandeId) {
        this.commandeId = commandeId;
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
}
