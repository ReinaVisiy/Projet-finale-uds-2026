package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO de la demande de retrait cote plateforme (role admin).
 * Les coordonnees de paiement (methode + numero) sont demandees ici, au
 * moment du retrait, uniquement a des fins de simulation d'un virement
 * Mobile Money / Orange Money - aucune coordonnee de paiement n'est
 * conservee ailleurs dans le systeme.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandeRetraitPlateformeDTO {

    private BigDecimal montant;

    private String methode; // "MOMO" ou "ORANGE_MONEY"

    private String numero; // Numero de telephone beneficiaire
}
