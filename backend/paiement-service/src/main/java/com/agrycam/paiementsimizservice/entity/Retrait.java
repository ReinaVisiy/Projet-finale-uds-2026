package com.agrycam.paiementsimizservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entite représentant un retrait de fonds simule effectue par un vendeur.
 */
@Entity
@Table(name = "retraits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Retrait {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendeur_id", nullable = false)
    private Long vendeurId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montant;

    @Column(name = "reference_paiement", nullable = false, unique = true)
    private String referencePaiement; // ex. "PAYOUT-" + UUID

    @Column(nullable = false, length = 20)
    private String statut; // "COMPLETE"

    @Column(name = "date_demande", nullable = false)
    private LocalDateTime dateDemande;

    @PrePersist
    protected void onCreate() {
        this.dateDemande = LocalDateTime.now();
        if (this.statut == null) {
            this.statut = "COMPLETE";
        }
    }
}
