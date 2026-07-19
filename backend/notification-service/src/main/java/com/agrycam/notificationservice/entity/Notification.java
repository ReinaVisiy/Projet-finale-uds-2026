package com.agrycam.notificationservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long destinataireId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    // Sévérité visuelle (info/succès/avertissement/erreur), indépendante
    // du domaine métier ci-dessus. Nullable en base (pour ne pas casser
    // le ddl-auto=update sur une base contenant déjà des notifications
    // sans cette colonne) ; les nouvelles notifications reçoivent INFO
    // par défaut via @Builder.Default et NotificationService.
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NotificationSeverity niveau = NotificationSeverity.INFO;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column
    private String lien;

    @Column(nullable = false)
    @Builder.Default
    private boolean lu = false;

    @Column(nullable = false)
    private LocalDateTime dateEnvoi;

    @PrePersist
    protected void onCreate() {
        if (dateEnvoi == null) {
            dateEnvoi = LocalDateTime.now();
        }
    }
}
