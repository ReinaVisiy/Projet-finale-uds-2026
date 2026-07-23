package com.agrycam.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private Long destinataireId;
    private String type;
    private String niveau;
    private String messageKey;
    private Map<String, Object> parametres;
    private String lien;
    private boolean lu;
    private LocalDateTime dateEnvoi;
}
