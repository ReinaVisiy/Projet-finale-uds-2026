package com.agrimarket.paiement_service.client;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CommandeDTO {
    private Long id;
    private BigDecimal montantTotal;
    private String statut;
}