package com.agrycam.paiementservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entite representant le portefeuille global de la plateforme AgryCam
 * (ligne unique, singleton). Alimente par :
 *   - la commission de 5% prelevee sur chaque transaction payee ;
 *   - les frais d'annulation de 10% retenus sur les commandes annulees
 *     avant expedition.
 * Deux compteurs distincts, sur le meme modele que SoldeVendeur :
 *   - totalGagne : cumul historique de tout ce que la plateforme a gagne
 *     depuis le debut, ne diminue jamais (utile pour les statistiques).
 *   - soldeDisponible : montant reellement retirable par un admin. Credite
 *     en meme temps que totalGagne, mais debite a chaque retrait.
 */
@Entity
@Table(name = "solde_plateforme")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SoldePlateforme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_gagne", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalGagne;

    @Column(name = "solde_disponible", nullable = false, precision = 14, scale = 2)
    private BigDecimal soldeDisponible;

    @Column(nullable = false, length = 10)
    private String devise; // ex. "XAF"

    @Column(name = "date_mise_a_jour", nullable = false)
    private LocalDateTime dateMiseAJour;

    @PrePersist
    protected void onCreate() {
        this.dateMiseAJour = LocalDateTime.now();
        if (this.totalGagne == null) {
            this.totalGagne = BigDecimal.ZERO;
        }
        if (this.soldeDisponible == null) {
            this.soldeDisponible = BigDecimal.ZERO;
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
