package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reponse de NotchPay a la creation d'un paiement (POST /payments).
 * Seul authorization_url nous interesse : c'est l'URL vers laquelle
 * rediriger le client pour payer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotchPayCreateResponse {
    private String authorization_url;
    private String reference;
    private String status;
    private String message;
}
