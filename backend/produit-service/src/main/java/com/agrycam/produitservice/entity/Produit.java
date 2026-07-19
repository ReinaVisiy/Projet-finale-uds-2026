package com.agrycam.produitservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "produit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal prix;

    @Column(nullable = false)
    private Integer stock;

    private String localisation;

    // TEXT au lieu du VARCHAR(255) par défaut : les images sont envoyées
    // en base64 par le frontend (readAsDataURL) et dépassent largement
    // 255 caractères pour une vraie photo.
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "date_ajout", nullable = false, updatable = false)
    private LocalDateTime dateAjout;

    @Column(nullable = false)
    private Boolean disponible = true;

    @Column(name = "id_producteur", nullable = false)
    private Long producteurId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categorie")
    private Categorie categorie;

    @PrePersist
    protected void onCreate() {
        this.dateAjout = LocalDateTime.now();
        if (this.disponible == null) {
            this.disponible = true;
        }
    }
}
