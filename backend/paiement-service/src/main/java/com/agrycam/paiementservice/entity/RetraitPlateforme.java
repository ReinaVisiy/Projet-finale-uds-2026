package com.agrycam.paiementservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entite representant un retrait de fonds simule effectue par un
 * administrateur depuis le portefeuille de la plateforme.
 * Contrairement au retrait vendeur (Retrait), aucune coordonnee de paiement
 * n'existait auparavant nulle part dans le systeme : on les demande donc ici
 * au moment du retrait (methode + numero), uniquement a des fins de
 * simulation d'un virement Mobile Money / Orange Money.
 */
@Entity
@Table(name = "retraits_plateforme")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetraitPlateforme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id", nullable = false)
    private Long adminId; // Admin ayant initie le retrait

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montant;

    @Column(nullable = false, length = 20)
    private String methode; // "MOMO" (MTN Mobile Money) ou "ORANGE_MONEY"

    @Column(nullable = false, length = 20)
    private String numero; // Numero de telephone beneficiaire (simulation)

    @Column(name = "reference_paiement", nullable = false, unique = true)
    private String referencePaiement; // ex. "PAYOUT-PLATEFORME-" + UUID

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
