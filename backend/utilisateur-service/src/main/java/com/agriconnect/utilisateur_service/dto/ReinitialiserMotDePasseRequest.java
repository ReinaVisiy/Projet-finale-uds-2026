package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

/**
 * Requete finale de reinitialisation de mot de passe : revalide le code
 * (cf. UtilisateurService#reinitialiserMotDePasse) puis applique le
 * nouveau mot de passe.
 */
@Data
public class ReinitialiserMotDePasseRequest {
    private String email;
    private String code;
    private String nouveauMotDePasse;
}
