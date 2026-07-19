package com.agrycam.notificationservice.controller;

import com.agrycam.notificationservice.dto.NotificationRequest;
import com.agrycam.notificationservice.dto.NotificationResponse;
import com.agrycam.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(@RequestBody NotificationRequest request) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/mes-notifications")
    public ResponseEntity<List<NotificationResponse>> getMesNotifications(Authentication authentication) {
        Long uid = (Long) authentication.getPrincipal();
        List<NotificationResponse> response = notificationService.getNotificationsByDestinataire(uid);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/non-lues/compteur")
    public ResponseEntity<Long> getNonLuesCompteur(Authentication authentication) {
        Long uid = (Long) authentication.getPrincipal();
        Long count = notificationService.countUnreadNotifications(uid);
        return ResponseEntity.ok(count);
    }

    @PutMapping("/{id}/lu")
    public ResponseEntity<?> marquerCommeLu(@PathVariable Long id, Authentication authentication) {
        NotificationResponse notification = notificationService.getNotificationById(id);
        
        if (!estProprietaire(authentication, notification.getDestinataireId()) && !estAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Accès refusé : vous n'êtes pas le destinataire de cette notification"));
        }
        
        NotificationResponse updated = notificationService.markAsRead(id);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/marquer-toutes-lues")
    public ResponseEntity<Map<String, String>> marquerToutesLues(Authentication authentication) {
        Long uid = (Long) authentication.getPrincipal();
        notificationService.markAllAsRead(uid);
        return ResponseEntity.ok(Map.of("message", "Toutes les notifications ont été marquées comme lues"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, Authentication authentication) {
        NotificationResponse notification = notificationService.getNotificationById(id);
        
        if (!estProprietaire(authentication, notification.getDestinataireId()) && !estAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("erreur", "Accès refusé : vous n'êtes pas autorisé à supprimer cette notification"));
        }
        
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(Map.of("message", "Notification supprimée avec succès"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications() {
        List<NotificationResponse> response = notificationService.getAllNotifications();
        return ResponseEntity.ok(response);
    }

    private boolean estProprietaire(Authentication authentication, Long destinataireId) {
        Object principal = authentication.getPrincipal();
        return principal instanceof Long && principal.equals(destinataireId);
    }

    private boolean estAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
    }
}
