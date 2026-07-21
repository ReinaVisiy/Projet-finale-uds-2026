package com.agrycam.paiementservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reponse de NotchPay a la creation d'un paiement (POST /payments).
 *
 * Bug corrige : le champ "reference" n'est PAS au premier niveau de la
 * reponse JSON de NotchPay, il est imbrique dans l'objet "transaction"
 * (cf. doc officielle : {"status":...,"transaction":{"reference":...},
 * "authorization_url":...}). L'ancienne version de ce DTO declarait
 * "reference" au premier niveau : Jackson ne levait pas d'erreur (les
 * champs inconnus sont ignores par defaut) mais getReference() renvoyait
 * toujours null, silencieusement. On garde desormais aussi la reference
 * que NotchPay nous renvoie reellement, pour pouvoir la comparer a celle
 * qu'on lui a envoyee et detecter tout ecart entre les deux.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotchPayCreateResponse {
    private String authorization_url;
    private String status;
    private String message;
    private NotchPayTransactionInfo transaction;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotchPayTransactionInfo {
        private String id;
        private String reference;
        private String status;
    }
}
