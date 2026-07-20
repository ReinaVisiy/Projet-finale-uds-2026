package com.agrycam.paiementservice.dto;

import com.agrycam.paiementservice.entity.TypeReference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO d'entree pour initier un paiement sur la plateforme.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiationPaiementDTO {
    
    private TypeReference typeReference; // COMMANDE ou CERTIFICATION
    
    private Long referenceId; // ID de la commande ou certification
    
    private Long vendeurId; // ID du vendeur bénéficiaire (pour le solde)
    
    private BigDecimal montant; // Montant total paye par le client
}
