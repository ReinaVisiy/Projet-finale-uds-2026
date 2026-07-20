package com.agrycam.paiementservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entite représentant une transaction de paiement initiee par un client.
 */
@Entity
@Table(name = "transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montant;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal commission; // 5% preleves par la plateforme

    @Column(name = "montant_net", nullable = false, precision = 12, scale = 2)
    private BigDecimal montantNet; // 95% destines au vendeur

    @Column(nullable = false, length = 10)
    private String devise; // ex. "XAF" ou "FCFA"

    @Enumerated(EnumType.STRING)
    @Column(name = "type_reference", nullable = false)
    private TypeReference typeReference; // COMMANDE ou CERTIFICATION

    @Column(name = "reference_id", nullable = false)
    private Long referenceId; // ID de la commande ou de la certification concernee

    @Column(name = "vendeur_id", nullable = false)
    private Long vendeurId;

    @Column(name = "simiz_session_id")
    private String simizSessionId; // ID de session retourne par Simiz

    @Column(name = "simiz_checkout_url", length = 1024)
    private String simizCheckoutUrl; // URL de redirection de paiement Simiz

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTransaction statut; // EN_ATTENTE, PAYE, ECHOUE, EXPIRE

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_confirmation")
    private LocalDateTime dateConfirmation;

    // Empeche une double liberation du sequestre si commande-service
    // notifie LIVREE plusieurs fois (retry, appel manuel, etc.).
    @Column(name = "fonds_liberes", nullable = false)
    @Builder.Default
    private boolean fondsLiberes = false;

    // Renseignes uniquement si la commande est annulee avant expedition :
    // 90% de montant est rembourse au client, 10% retenu par la plateforme
    // (frais d'annulation), en plus de la commission de 5% deja prelevee.
    @Column(name = "montant_rembourse_client", precision = 12, scale = 2)
    private BigDecimal montantRembourseClient;

    @Column(name = "frais_annulation", precision = 12, scale = 2)
    private BigDecimal fraisAnnulation;

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
        if (this.devise == null) {
            this.devise = "XAF";
        }
    }
}
