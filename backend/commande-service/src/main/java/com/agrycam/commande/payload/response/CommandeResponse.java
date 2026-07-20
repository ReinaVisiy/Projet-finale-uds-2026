package com.agrycam.commande.payload.response;

import com.agrycam.commande.model.StatutCommande;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO (Data Transfer Object) pour la réponse d'une commande.
 * Contient les détails d'une commande à retourner au client.
 */
public class CommandeResponse {
    private Long id;
    private Long clientId;
    private Long producteurId;
    private StatutCommande statut;
    private LocalDateTime dateCommande;
    private List<LigneCommandeResponse> lignesCommande;
    private double montantTotal;

    // Constructeur
    public CommandeResponse(Long id, Long clientId, Long producteurId, StatutCommande statut, LocalDateTime dateCommande, List<LigneCommandeResponse> lignesCommande) {
        this.id = id;
        this.clientId = clientId;
        this.producteurId = producteurId;
        this.statut = statut;
        this.dateCommande = dateCommande;
        this.lignesCommande = lignesCommande;
        this.montantTotal = lignesCommande == null ? 0.0 : lignesCommande.stream()
                .mapToDouble(lc -> lc.getPrixUnitaire() * lc.getQuantite())
                .sum();
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

    public List<LigneCommandeResponse> getLignesCommande() {
        return lignesCommande;
    }

    public void setLignesCommande(List<LigneCommandeResponse> lignesCommande) {
        this.lignesCommande = lignesCommande;
    }

    public double getMontantTotal() {
        return montantTotal;
    }

    public void setMontantTotal(double montantTotal) {
        this.montantTotal = montantTotal;
    }
}
