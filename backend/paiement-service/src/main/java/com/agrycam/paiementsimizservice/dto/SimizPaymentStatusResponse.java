package com.agrycam.paiementsimizservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Reponse retournee par Simiz lors de la verification du statut d'un paiement.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimizPaymentStatusResponse {
    
    private String id;
    
    private BigDecimal amount;
    
    private String currency;
    
    private String status; // SUCCESSFUL, FAILED, PENDING
    
    private Map<String, String> metadata;
}
