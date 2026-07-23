package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

/**
 * Requete de "mot de passe oublié" : declenche l'envoi d'un code de
 * verification par email (cf. UtilisateurService#demanderReinitialisationMotDePasse).
 */
@Data
public class MotDePasseOublieRequest {
    private String email;
}
