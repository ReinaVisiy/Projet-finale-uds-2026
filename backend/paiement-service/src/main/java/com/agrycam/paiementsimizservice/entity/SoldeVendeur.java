package com.agrycam.paiementsimizservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entite représentant le portefeuille (solde) d'un vendeur sur AgryCam.
 * Les fonds issus des transactions y sont credites après deduction de la commission de 5%.
 */
@Entity
@Table(name = "soldes_vendeurs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoldeVendeur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendeur_id", nullable = false, unique = true)
    private Long vendeurId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal solde; // Solde net disponible pour retrait

    @Column(nullable = false, length = 10)
    private String devise; // ex. "XAF"

    @Column(name = "date_mise_a_jour", nullable = false)
    private LocalDateTime dateMiseAJour;

    @PrePersist
    protected void onCreate() {
        this.dateMiseAJour = LocalDateTime.now();
        if (this.solde == null) {
            this.solde = BigDecimal.ZERO;
        }
        if (this.devise == null) {
            this.devise = "XAF";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.dateMiseAJour = LocalDateTime.now();
    }
}
