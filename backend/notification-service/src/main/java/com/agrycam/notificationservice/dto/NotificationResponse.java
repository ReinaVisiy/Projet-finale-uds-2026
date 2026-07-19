package com.agrycam.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private Long destinataireId;
    private String type;
    private String niveau;
    private String titre;
    private String contenu;
    private String lien;
    private boolean lu;
    private LocalDateTime dateEnvoi;
}
