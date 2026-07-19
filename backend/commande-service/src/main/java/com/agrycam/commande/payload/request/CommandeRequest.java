package com.agrycam.commande.payload.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTO (Data Transfer Object) pour la création d'une nouvelle commande.
 * Contient l'ID du client et la liste des lignes de commande.
 */
public class CommandeRequest {

    @NotNull(message = "L'ID du client ne peut pas être nul")
    private Long clientId;

    @Valid
    @Size(min = 1, message = "La commande doit contenir au moins une ligne de commande")
    private List<LigneCommandeRequest> lignesCommande;

    // Getters et Setters
    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public List<LigneCommandeRequest> getLignesCommande() {
        return lignesCommande;
    }

    public void setLignesCommande(List<LigneCommandeRequest> lignesCommande) {
        this.lignesCommande = lignesCommande;
    }
}
