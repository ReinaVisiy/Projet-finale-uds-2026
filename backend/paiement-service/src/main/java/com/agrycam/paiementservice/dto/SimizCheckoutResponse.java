package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Reponse retournee par Simiz lors de la creation d'un paiement
 * (POST /payments). Ne mappe que les champs utilises par
 * paiement-service ; Simiz renvoie egalement id, projectId, payerPhone,
 * payerName, payerEmail, livemode, createdAt, completedAt, etc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimizCheckoutResponse {

    /** Token unique du paiement (ex. pay_abc123xyz789), utilise pour la verification et le webhook. */
    private String token;

    private BigDecimal amount;

    private String currency;

    /** PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, EXPIRED, REFUNDED, PARTIALLY_REFUNDED */
    private String status;

    /** URL Simiz vers laquelle rediriger le client pour payer. */
    private String paymentUrl;

    private String createdAt;
}
