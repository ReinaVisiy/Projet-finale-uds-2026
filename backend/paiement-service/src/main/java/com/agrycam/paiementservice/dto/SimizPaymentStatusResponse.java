package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Reponse retournee par Simiz lors de la verification du statut d'un
 * paiement (GET /payments/{token}/verify). Meme forme que la reponse de
 * creation, seul le statut nous interesse ici pour le sondage.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimizPaymentStatusResponse {

    private String token;

    private BigDecimal amount;

    private String currency;

    /** PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, EXPIRED, REFUNDED, PARTIALLY_REFUNDED */
    private String status;
}
