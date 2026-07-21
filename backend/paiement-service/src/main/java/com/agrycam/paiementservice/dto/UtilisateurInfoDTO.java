package com.agrycam.paiementservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO minimal pour lire les informations d'un utilisateur depuis
 * utilisateur-service (GET /api/utilisateurs/{id}). Ne mappe que les
 * champs necessaires a NotchPay (nom, email, telephone) ; le reste de la
 * reponse (adresse, role, plan...) est ignore.
 */
@Data
@NoArgsConstructor
public class UtilisateurInfoDTO {
    private Long id;
    private String nom;
    private String email;
    private String telephone;
}
