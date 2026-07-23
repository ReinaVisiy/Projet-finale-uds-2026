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

    // Clé de traduction (ex. "newOrder") au lieu d'une phrase déjà
    // rendue : le texte final est construit côté frontend, avec les
    // paramètres ci-dessous, dans la langue de celui qui CONSULTE la
    // notification (et non celle de celui qui l'a déclenchée).
    @Column(nullable = false)
    private String messageKey;

    // Données brutes nécessaires à la reconstruction du message (ex.
    // {"id":42,"name":"Awa"}), sérialisées en JSON. Stockées telles
    // quelles (langue-agnostiques) plutôt que la phrase déjà traduite,
    // pour que la traduction se fasse à la lecture, dans la langue
    // actuellement choisie par le destinataire.
    @Column(columnDefinition = "TEXT")
    private String parametres;

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
