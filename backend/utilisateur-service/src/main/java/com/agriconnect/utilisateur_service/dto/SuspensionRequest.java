package com.agriconnect.utilisateur_service.dto;

import lombok.Data;

/**
 * Requete pour suspendre/lever la suspension d'un compte (action admin).
 * jours = nombre de jours de suspension à partir de maintenant.
 * jours == null ou <= 0 lève la suspension immédiatement.
 * Il n'existe pas de "blocage définitif" séparé : pour un blocage
 * quasi permanent, l'admin choisit simplement un grand nombre de jours
 * (ex: 36500 pour ~100 ans).
 */
@Data
public class SuspensionRequest {
    private Integer jours;
}
