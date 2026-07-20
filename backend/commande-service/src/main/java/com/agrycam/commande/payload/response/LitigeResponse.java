package com.agrycam.commande.payload.response;

import com.agrycam.commande.model.StatutLitige;
import com.agrycam.commande.model.TypeLitige;

import java.time.LocalDateTime;

/**
 * DTO de reponse pour un litige. fondsDejaRetires est calcule a la volee
 * (interrogation de paiement-service) et pilote, cote admin, l'activation
 * du bouton "Rembourser" en un clic : uniquement pertinent pour les
 * litiges de type PRODUIT_NON_LIVRE, null si indetermine (service de
 * paiement injoignable — l'admin doit alors traiter manuellement).
 */
public class LitigeResponse {
    private Long id;
    private Long commandeId;
    private Long clientId;
    private TypeLitige type;
    private String description;
    private StatutLitige statut;
    private LocalDateTime dateCreation;
    private LocalDateTime dateResolution;
    private Boolean fondsDejaRetires;

    public LitigeResponse(Long id, Long commandeId, Long clientId, TypeLitige type, String description,
                           StatutLitige statut, LocalDateTime dateCreation, LocalDateTime dateResolution,
                           Boolean fondsDejaRetires) {
        this.id = id;
        this.commandeId = commandeId;
        this.clientId = clientId;
        this.type = type;
        this.description = description;
        this.statut = statut;
        this.dateCreation = dateCreation;
        this.dateResolution = dateResolution;
        this.fondsDejaRetires = fondsDejaRetires;
    }

    public Long getId() { return id; }
    public Long getCommandeId() { return commandeId; }
    public Long getClientId() { return clientId; }
    public TypeLitige getType() { return type; }
    public String getDescription() { return description; }
    public StatutLitige getStatut() { return statut; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public LocalDateTime getDateResolution() { return dateResolution; }
    public Boolean getFondsDejaRetires() { return fondsDejaRetires; }
}
