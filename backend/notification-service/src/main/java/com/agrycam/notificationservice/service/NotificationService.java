package com.agrycam.notificationservice.service;

import com.agrycam.notificationservice.dto.NotificationRequest;
import com.agrycam.notificationservice.dto.NotificationResponse;
import com.agrycam.notificationservice.entity.Notification;
import com.agrycam.notificationservice.entity.NotificationSeverity;
import com.agrycam.notificationservice.entity.NotificationType;
import com.agrycam.notificationservice.repository.NotificationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        if (request.getDestinataireId() == null) {
            throw new RuntimeException("Le destinataireId ne peut pas être nul");
        }
        if (request.getType() == null) {
            throw new RuntimeException("Le type de notification ne peut pas être nul");
        }

        NotificationType type;
        try {
            type = NotificationType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Type de notification invalide: " + request.getType());
        }

        // Le niveau (sévérité) est optionnel côté appelant : une valeur
        // absente ou invalide retombe sur INFO plutôt que de faire
        // échouer la création (contrairement à "type", qui reste
        // obligatoire et strict).
        NotificationSeverity niveau = NotificationSeverity.INFO;
        if (request.getNiveau() != null) {
            try {
                niveau = NotificationSeverity.valueOf(request.getNiveau().toUpperCase());
            } catch (IllegalArgumentException e) {
                // valeur inconnue : on garde INFO par défaut sans bloquer l'appelant
            }
        }

        Notification notification = Notification.builder()
                .destinataireId(request.getDestinataireId())
                .type(type)
                .niveau(niveau)
                .messageKey(request.getMessageKey())
                .parametres(serialiserParametres(request.getParametres()))
                .lien(request.getLien())
                .lu(false)
                .dateEnvoi(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    public List<NotificationResponse> getNotificationsByDestinataire(Long destinataireId) {
        return notificationRepository.findByDestinataireIdOrderByDateEnvoiDesc(destinataireId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Long countUnreadNotifications(Long destinataireId) {
        return notificationRepository.countByDestinataireIdAndLuFalse(destinataireId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable avec l'id: " + id));
        notification.setLu(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Transactional
    public void markAllAsRead(Long destinataireId) {
        List<Notification> unread = notificationRepository.findAllByDestinataireIdAndLuFalse(destinataireId);
        for (Notification n : unread) {
            n.setLu(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable avec l'id: " + id));
        notificationRepository.delete(notification);
    }

    public List<NotificationResponse> getAllNotifications() {
        return notificationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public NotificationResponse getNotificationById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable avec l'id: " + id));
        return mapToResponse(notification);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .destinataireId(notification.getDestinataireId())
                .type(notification.getType().name())
                .niveau(notification.getNiveau() != null ? notification.getNiveau().name() : null)
                .messageKey(notification.getMessageKey())
                .parametres(deserialiserParametres(notification.getParametres()))
                .lien(notification.getLien())
                .lu(notification.isLu())
                .dateEnvoi(notification.getDateEnvoi())
                .build();
    }

    private String serialiserParametres(Map<String, Object> parametres) {
        if (parametres == null) return null;
        try {
            return objectMapper.writeValueAsString(parametres);
        } catch (Exception e) {
            throw new RuntimeException("Impossible de sérialiser les paramètres de la notification", e);
        }
    }

    private Map<String, Object> deserialiserParametres(String parametresJson) {
        if (parametresJson == null || parametresJson.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(parametresJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            // Une notification dont les paramètres sont illisibles ne doit
            // pas faire planter tout l'affichage de la liste : on retombe
            // sur une map vide, le frontend gérera l'absence de valeur.
            return Collections.emptyMap();
        }
    }
}
