package com.agrycam.paiementsimizservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Reponse retournee par Simiz lors de la creation d'un checkout.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimizCheckoutResponse {
    
    private String id; // Session ID (ex. simiz_pay_abc123xyz)
    
    private BigDecimal amount;
    
    private String currency;
    
    private String status; // PENDING
    
    private String checkoutUrl; // URL vers la page de paiement Simiz
    
    private String createdAt;
}
