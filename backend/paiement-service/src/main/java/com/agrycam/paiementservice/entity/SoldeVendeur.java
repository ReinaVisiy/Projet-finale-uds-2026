package com.agrycam.paiementservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entite représentant le portefeuille (solde) d'un vendeur sur AgryCam.
 * Le solde est scinde en deux :
 *   - soldeSequestre : fonds verrouilles des qu'un paiement est confirme,
 *     tant que la commande correspondante n'est pas LIVREE. Ne peut pas
 *     etre retire.
 *   - soldeDisponible : fonds liberes du sequestre une fois la commande
 *     LIVREE (ou son remboursement traite). Seul ce solde peut etre retire.
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

    @Column(name = "solde_sequestre", nullable = false, precision = 12, scale = 2)
    private BigDecimal soldeSequestre;

    @Column(name = "solde_disponible", nullable = false, precision = 12, scale = 2)
    private BigDecimal soldeDisponible;

    @Column(nullable = false, length = 10)
    private String devise; // ex. "XAF"

    @Column(name = "date_mise_a_jour", nullable = false)
    private LocalDateTime dateMiseAJour;

    @PrePersist
    protected void onCreate() {
        this.dateMiseAJour = LocalDateTime.now();
        if (this.soldeSequestre == null) {
            this.soldeSequestre = BigDecimal.ZERO;
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
