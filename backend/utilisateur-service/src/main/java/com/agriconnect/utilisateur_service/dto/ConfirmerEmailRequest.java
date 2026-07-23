package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

/**
 * Requete de confirmation d'email a l'inscription : le code recu par
 * email (cf. MailService#envoyerCodeConfirmation) doit correspondre a
 * celui genere pour ce compte et ne pas etre expire.
 */
@Data
public class ConfirmerEmailRequest {
    private String email;
    private String code;
}
