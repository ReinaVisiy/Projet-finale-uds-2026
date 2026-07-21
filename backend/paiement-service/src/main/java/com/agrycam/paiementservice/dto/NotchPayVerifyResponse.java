package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reponse de NotchPay a la verification d'un paiement
 * (GET /payments/{reference}). Le statut se trouve dans l'objet
 * imbrique "transaction" (cf. exemple de callback dans la doc officielle).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotchPayVerifyResponse {
    private NotchPayTransactionStatus transaction;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotchPayTransactionStatus {
        /** Valeurs observees : pending, processing, complete, failed, canceled, expired */
        private String status;
    }
}
