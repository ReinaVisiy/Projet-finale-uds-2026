package com.agrycam.paiementservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entite représentant un retrait de fonds simule effectue par un vendeur.
 * Comme pour le retrait plateforme (RetraitPlateforme), aucune coordonnee
 * de paiement n'existait auparavant nulle part dans le systeme pour le
 * vendeur : on les demande donc ici (methode + numero), uniquement a des
 * fins de simulation d'un virement Mobile Money / Orange Money.
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

    @Column(nullable = false, length = 20)
    private String methode; // "MOMO" (MTN Mobile Money) ou "ORANGE_MONEY"

    @Column(nullable = false, length = 20)
    private String numero; // Numero de telephone beneficiaire (simulation)

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
