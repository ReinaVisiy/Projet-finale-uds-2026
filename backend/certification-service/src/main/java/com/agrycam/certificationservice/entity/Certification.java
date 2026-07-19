package com.agrycam.certificationservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "certification")
public class Certification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_producteur", nullable = false)
    private Long producteurId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document")
    private TypeDocument typeDocument;

    // TEXT au lieu du VARCHAR(255) par défaut : ces trois champs reçoivent
    // des photos encodées en base64 (readAsDataURL côté frontend), qui
    // dépassent largement 255 caractères pour une vraie image.
    @Column(name = "id_recto", columnDefinition = "TEXT")
    private String idRecto;

    @Column(name = "id_verso", columnDefinition = "TEXT")
    private String idVerso;

    @Column(name = "photo_utilisateur", columnDefinition = "TEXT")
    private String photoUtilisateur;

    @Column(name = "duree_mois", nullable = false)
    private Integer dureeMois;

    @Column(nullable = false)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(name = "moyen_paiement")
    private MoyenPaiement moyenPaiement;

    @Column(name = "numero_paiement", nullable = false)
    private String numeroPaiement;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_paiement")
    private StatutPaiement statutPaiement;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private StatutCertification statut;

    @Column(name = "date_demande")
    private LocalDateTime dateDemande;

    @Column(name = "date_approbation")
    private LocalDateTime dateApprobation;

    @Column(name = "date_expiration")
    private LocalDateTime dateExpiration;

    @Column(name = "id_admin_reviseur")
    private Long adminReviseurId;

    @Column(name = "motif_rejet")
    private String motifRejet;

    @PrePersist
    protected void onCreate() {
        this.dateDemande = LocalDateTime.now();
        if (this.statut == null) {
            this.statut = StatutCertification.EN_ATTENTE;
        }
        if (this.statutPaiement == null) {
            this.statutPaiement = StatutPaiement.EN_ATTENTE;
        }
    }

    // Constructeur par défaut
    public Certification() {
    }

    // Constructeur complet
    public Certification(Long id, Long producteurId, TypeDocument typeDocument, String idRecto, String idVerso, 
                         String photoUtilisateur, Integer dureeMois, BigDecimal montant, MoyenPaiement moyenPaiement, 
                         String numeroPaiement, StatutPaiement statutPaiement, StatutCertification statut, 
                         LocalDateTime dateDemande, LocalDateTime dateApprobation, LocalDateTime dateExpiration, 
                         Long adminReviseurId, String motifRejet) {
        this.id = id;
        this.producteurId = producteurId;
        this.typeDocument = typeDocument;
        this.idRecto = idRecto;
        this.idVerso = idVerso;
        this.photoUtilisateur = photoUtilisateur;
        this.dureeMois = dureeMois;
        this.montant = montant;
        this.moyenPaiement = moyenPaiement;
        this.numeroPaiement = numeroPaiement;
        this.statutPaiement = statutPaiement;
        this.statut = statut;
        this.dateDemande = dateDemande;
        this.dateApprobation = dateApprobation;
        this.dateExpiration = dateExpiration;
        this.adminReviseurId = adminReviseurId;
        this.motifRejet = motifRejet;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProducteurId() {
        return producteurId;
    }

    public void setProducteurId(Long producteurId) {
        this.producteurId = producteurId;
    }

    public TypeDocument getTypeDocument() {
        return typeDocument;
    }

    public void setTypeDocument(TypeDocument typeDocument) {
        this.typeDocument = typeDocument;
    }

    public String getIdRecto() {
        return idRecto;
    }

    public void setIdRecto(String idRecto) {
        this.idRecto = idRecto;
    }

    public String getIdVerso() {
        return idVerso;
    }

    public void setIdVerso(String idVerso) {
        this.idVerso = idVerso;
    }

    public String getPhotoUtilisateur() {
        return photoUtilisateur;
    }

    public void setPhotoUtilisateur(String photoUtilisateur) {
        this.photoUtilisateur = photoUtilisateur;
    }

    public Integer getDureeMois() {
        return dureeMois;
    }

    public void setDureeMois(Integer dureeMois) {
        this.dureeMois = dureeMois;
    }

    public BigDecimal getMontant() {
        return montant;
    }

    public void setMontant(BigDecimal montant) {
        this.montant = montant;
    }

    public MoyenPaiement getMoyenPaiement() {
        return moyenPaiement;
    }

    public void setMoyenPaiement(MoyenPaiement moyenPaiement) {
        this.moyenPaiement = moyenPaiement;
    }

    public String getNumeroPaiement() {
        return numeroPaiement;
    }

    public void setNumeroPaiement(String numeroPaiement) {
        this.numeroPaiement = numeroPaiement;
    }

    public StatutPaiement getStatutPaiement() {
        return statutPaiement;
    }

    public void setStatutPaiement(StatutPaiement statutPaiement) {
        this.statutPaiement = statutPaiement;
    }

    public StatutCertification getStatut() {
        return statut;
    }

    public void setStatut(StatutCertification statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateDemande() {
        return dateDemande;
    }

    public void setDateDemande(LocalDateTime dateDemande) {
        this.dateDemande = dateDemande;
    }

    public LocalDateTime getDateApprobation() {
        return dateApprobation;
    }

    public void setDateApprobation(LocalDateTime dateApprobation) {
        this.dateApprobation = dateApprobation;
    }

    public LocalDateTime getDateExpiration() {
        return dateExpiration;
    }

    public void setDateExpiration(LocalDateTime dateExpiration) {
        this.dateExpiration = dateExpiration;
    }

    public Long getAdminReviseurId() {
        return adminReviseurId;
    }

    public void setAdminReviseurId(Long adminReviseurId) {
        this.adminReviseurId = adminReviseurId;
    }

    public String getMotifRejet() {
        return motifRejet;
    }

    public void setMotifRejet(String motifRejet) {
        this.motifRejet = motifRejet;
    }
}
