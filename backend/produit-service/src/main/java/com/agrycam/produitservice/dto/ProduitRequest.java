package com.agrycam.produitservice.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProduitRequest {
    private String nom;
    private String description;
    private BigDecimal prix;
    private Integer stock;
    private String imageUrl;
    private String localisation;
    private Long categorieId;
}
