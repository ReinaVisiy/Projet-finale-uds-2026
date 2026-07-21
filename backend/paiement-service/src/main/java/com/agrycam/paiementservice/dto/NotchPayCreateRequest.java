package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Corps de la requete POST /payments envoyee a NotchPay pour initier un
 * paiement. Correspond exactement au schema de la documentation officielle.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotchPayCreateRequest {

    private BigDecimal amount;

    private String currency;

    private NotchPayCustomer customer;

    private String description;

    /** URL unique de retour (NotchPay ne distingue pas succes/echec par URL separee). */
    private String callback;

    /** Notre reference unique locale (ID de transaction AgryCam). */
    private String reference;
}
