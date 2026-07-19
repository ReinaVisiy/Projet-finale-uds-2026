package com.agrycam.notificationservice.service;

import com.agrycam.notificationservice.dto.NotificationRequest;
import com.agrycam.notificationservice.dto.NotificationResponse;
import com.agrycam.notificationservice.entity.Notification;
import com.agrycam.notificationservice.entity.NotificationSeverity;
import com.agrycam.notificationservice.entity.NotificationType;
import com.agrycam.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

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
                .titre(request.getTitre())
                .contenu(request.getContenu())
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
                .titre(notification.getTitre())
                .contenu(notification.getContenu())
                .lien(notification.getLien())
                .lu(notification.isLu())
                .dateEnvoi(notification.getDateEnvoi())
                .build();
    }
}
