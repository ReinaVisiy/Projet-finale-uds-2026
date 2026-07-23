package com.agrycam.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {
    private Long destinataireId;
    private String type;
    private String niveau; // optionnel : INFO (défaut) | SUCCES | AVERTISSEMENT | ERREUR
    // Clé de traduction (ex. "newOrder") — le frontend traduit avec
    // cette clé + parametres, dans la langue du destinataire, au moment
    // où il consulte la notification.
    private String messageKey;
    private Map<String, Object> parametres;
    private String lien;
}
