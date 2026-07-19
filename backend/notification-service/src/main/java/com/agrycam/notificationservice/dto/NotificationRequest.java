package com.agrycam.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequest {
    private Long destinataireId;
    private String type;
    private String niveau; // optionnel : INFO (défaut) | SUCCES | AVERTISSEMENT | ERREUR
    private String titre;
    private String contenu;
    private String lien;
}
