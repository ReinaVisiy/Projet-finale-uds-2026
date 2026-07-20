package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Requete envoyee a l'API Simiz pour creer une session de checkout.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimizCheckoutRequest {
    
    private BigDecimal amount;
    
    private String currency;
    
    private String description;
    
    private String cancelUrl;
    
    private String successUrl;
    
    private Map<String, String> metadata;
}
