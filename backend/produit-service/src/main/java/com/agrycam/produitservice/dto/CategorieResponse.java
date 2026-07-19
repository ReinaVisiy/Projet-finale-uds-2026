package com.agrycam.produitservice.dto;

import lombok.Getter;

@Getter
public class CategorieResponse {
    private final Long id;
    private final String nom;

    public CategorieResponse(Long id, String nom) {
        this.id = id;
        this.nom = nom;
    }
}
