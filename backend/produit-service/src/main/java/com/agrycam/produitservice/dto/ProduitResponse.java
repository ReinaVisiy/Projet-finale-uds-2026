package com.agrycam.produitservice.dto;

import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class ProduitResponse {
    private final Long id;
    private final String nom;
    private final String description;
    private final BigDecimal prix;
    private final Integer stock;
    private final String imageUrl;
    private final String localisation;
    private final LocalDateTime dateAjout;
    private final Long producteurId;
    private final String producteurNom;
    private final Long categorieId;
    private final String categorieNom;
    private final Double noteMoyenne;
    private final Long nombreAvis;
    private final Boolean certifie;

    public ProduitResponse(
            Long id,
            String nom,
            String description,
            BigDecimal prix,
            Integer stock,
            String imageUrl,
            String localisation,
            LocalDateTime dateAjout,
            Long producteurId,
            String producteurNom,
            Long categorieId,
            String categorieNom,
            Double noteMoyenne,
            Long nombreAvis,
            Boolean certifie) {
        this.id = id;
        this.nom = nom;
        this.description = description;
        this.prix = prix;
        this.stock = stock;
        this.imageUrl = imageUrl;
        this.localisation = localisation;
        this.dateAjout = dateAjout;
        this.producteurId = producteurId;
        this.producteurNom = producteurNom;
        this.categorieId = categorieId;
        this.categorieNom = categorieNom;
        this.noteMoyenne = noteMoyenne;
        this.nombreAvis = nombreAvis;
        this.certifie = certifie;
    }
}