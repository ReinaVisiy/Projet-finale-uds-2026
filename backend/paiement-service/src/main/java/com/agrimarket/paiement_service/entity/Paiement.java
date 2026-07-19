package com.agrimarket.paiement_service.entity;

import com.agrimarket.paiement_service.enums.MethodePaiement;
import com.agrimarket.paiement_service.enums.StatutPaiement;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MethodePaiement methode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPaiement statut;

    @Column
    private String numeroPaiement;

    @Column
    private String reference;

    @Column(nullable = false)
    private LocalDateTime datePaiement;

    // Remplace @ManyToOne Commande -> juste l'ID
    @Column(name = "commande_id", nullable = false)
    private Long commandeId;

    // Remplace @ManyToOne Utilisateur -> juste l'ID
    @Column(name = "consommateur_id", nullable = false)
    private Long consommateurId;

    @PrePersist
    public void prePersist() {
        this.datePaiement = LocalDateTime.now();
        if (this.statut == null) this.statut = StatutPaiement.EN_ATTENTE;
    }
}