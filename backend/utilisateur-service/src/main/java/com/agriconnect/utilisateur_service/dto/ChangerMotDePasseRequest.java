package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

/**
 * Requete pour le changement de mot de passe d'un utilisateur.
 * L'ancien mot de passe est exige pour verifier l'identite de
 * l'utilisateur avant d'appliquer le nouveau.
 */
@Data
public class ChangerMotDePasseRequest {
    private String ancienMotDePasse;
    private String nouveauMotDePasse;
}
