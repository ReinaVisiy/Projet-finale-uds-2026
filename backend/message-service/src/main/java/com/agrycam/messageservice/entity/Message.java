package com.agrycam.messageservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(name = "date_envoi", nullable = false)
    private LocalDateTime dateEnvoi;

    // Image jointe au message, encodee en base64 (data URL complete, ex.
    // "data:image/png;base64,...") pour eviter d'ajouter un stockage de
    // fichiers separe. Nullable : la plupart des messages restent texte
    // seul. Taille plafonnee cote service (cf. MessageService#envoyer).
    @Column(name = "image_data", columnDefinition = "TEXT")
    private String imageData;

    @Column(name = "est_lu", nullable = false)
    private Boolean estLu = false;

    @Column(name = "est_delivre", nullable = false)
    private Boolean estDelivre = false;

    @Column(name = "id_expediteur", nullable = false)
    private Long expediteurId;

    @Column(name = "id_destinataire", nullable = false)
    private Long destinataireId;

    @Column(name = "nom_expediteur")
    private String expediteurNom;

    @Column(name = "nom_destinataire")
    private String destinataireNom;

    @PrePersist
    protected void onCreate() {
        if (this.dateEnvoi == null) {
            this.dateEnvoi = LocalDateTime.now();
        }
        if (this.estLu == null) {
            this.estLu = false;
        }
        if (this.estDelivre == null) {
            this.estDelivre = false;
        }
    }
}
