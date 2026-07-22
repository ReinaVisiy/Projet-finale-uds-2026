package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO representant le recu de retrait plateforme simule genere.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetraitPlateformeDTO {

    private Long id;

    private BigDecimal montant;

    private String methode;

    private String numero;

    private String referencePaiement; // ex. "PAYOUT-PLATEFORME-" + UUID

    private String statut; // ex. "COMPLETE"

    private LocalDateTime dateDemande;
}
