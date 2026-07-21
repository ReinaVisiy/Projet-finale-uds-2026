package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Requete envoyee a l'API Simiz pour initier un paiement.
 *
 * Correspond exactement au corps attendu par POST /payments de Simiz
 * (cf. documentation officielle : userId, amount, currency, returnUrl,
 * cancelUrl, description). Simiz ne cree pas de "session de checkout"
 * separee : /payments renvoie directement la Transaction avec son
 * paymentUrl, vers laquelle on redirige le client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimizCheckoutRequest {

    /**
     * Simiz exige un UUID. Notre systeme utilise des identifiants Long en
     * interne, donc cet UUID est derive de maniere deterministe a partir du
     * clientId (cf. PaiementService). Il ne sert qu'a l'identification cote
     * Simiz, pas a la logique metier locale.
     */
    private UUID userId;

    private BigDecimal amount;

    private String currency;

    private String description;

    private String cancelUrl;

    private String returnUrl;
}
