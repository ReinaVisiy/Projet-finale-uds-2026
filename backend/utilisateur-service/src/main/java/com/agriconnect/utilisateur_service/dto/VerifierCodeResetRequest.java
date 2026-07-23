package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

/**
 * Requete de verification du code de reinitialisation de mot de passe,
 * avant l'etape finale de saisie du nouveau mot de passe (cf.
 * UtilisateurService#verifierCodeReinitialisation).
 */
@Data
public class VerifierCodeResetRequest {
    private String email;
    private String code;
}
