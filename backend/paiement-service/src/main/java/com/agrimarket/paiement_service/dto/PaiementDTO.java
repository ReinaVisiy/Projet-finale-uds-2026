package com.agrimarket.paiement_service.dto;

import com.agrimarket.paiement_service.enums.MethodePaiement;
import com.agrimarket.paiement_service.enums.StatutPaiement;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaiementDTO {

    @Data
    public static class Request {
        @NotNull
        private Long commandeId;

        @NotNull
        private MethodePaiement methode;

        @NotNull
        private String numeroPaiement;

        private Long consommateurId;
        private String reference;
    }

    @Data
    public static class CommandeResponse {
        private Long id;
        private BigDecimal montantTotal;
        private String statut;
        private Long consommateurId;
    }

    @Data
    public static class Response {
        private Long id;
        private BigDecimal montant;
        private MethodePaiement methode;
        private StatutPaiement statut;
        private String numeroPaiement;
        private String reference;
        private LocalDateTime datePaiement;
        private Long commandeId;
        private Long consommateurId;
    }
}