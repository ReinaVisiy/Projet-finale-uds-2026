package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO représentant une demande de retrait ou le recu de retrait simule genere.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetraitDTO {
    
    private Long id;
    
    private Long vendeurId;
    
    private BigDecimal montant; // Montant debite
    
    private String referencePaiement; // ex. "PAYOUT-" + UUID
    
    private String statut; // ex. "COMPLETE"
    
    private LocalDateTime dateDemande;
}
