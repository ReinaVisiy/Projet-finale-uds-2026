package com.agrycam.certificationservice.dto;

import com.agrycam.certificationservice.entity.TypeDocument;
import com.agrycam.certificationservice.entity.MoyenPaiement;
import com.agrycam.certificationservice.entity.StatutPaiement;
import com.agrycam.certificationservice.entity.StatutCertification;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CertificationResponse {

    private final Long id;
    private final Long producteurId;
    private final TypeDocument typeDocument;
    private final String idRecto;
    private final String idVerso;
    private final String photoUtilisateur;
    private final Integer dureeMois;
    private final BigDecimal montant;
    private final MoyenPaiement moyenPaiement;
    private final String numeroPaiement;
    private final StatutPaiement statutPaiement;
    private final StatutCertification statut;
    private final LocalDateTime dateDemande;
    private final LocalDateTime dateApprobation;
    private final LocalDateTime dateExpiration;
    private final Long adminReviseurId;
    private final String motifRejet;
    private final Boolean estActive;

    public CertificationResponse(Long id, Long producteurId, TypeDocument typeDocument, String idRecto, String idVerso,
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

        // Calcul automatique de estActive
        if (statut == StatutCertification.APPROUVEE && dateExpiration != null) {
            this.estActive = dateExpiration.isAfter(LocalDateTime.now());
        } else {
            this.estActive = false;
        }
    }

    public Long getId() {
        return id;
    }

    public Long getProducteurId() {
        return producteurId;
    }

    public TypeDocument getTypeDocument() {
        return typeDocument;
    }

    public String getIdRecto() {
        return idRecto;
    }

    public String getIdVerso() {
        return idVerso;
    }

    public String getPhotoUtilisateur() {
        return photoUtilisateur;
    }

    public Integer getDureeMois() {
        return dureeMois;
    }

    public BigDecimal getMontant() {
        return montant;
    }

    public MoyenPaiement getMoyenPaiement() {
        return moyenPaiement;
    }

    public String getNumeroPaiement() {
        return numeroPaiement;
    }

    public StatutPaiement getStatutPaiement() {
        return statutPaiement;
    }

    public StatutCertification getStatut() {
        return statut;
    }

    public LocalDateTime getDateDemande() {
        return dateDemande;
    }

    public LocalDateTime getDateApprobation() {
        return dateApprobation;
    }

    public LocalDateTime getDateExpiration() {
        return dateExpiration;
    }

    public Long getAdminReviseurId() {
        return adminReviseurId;
    }

    public String getMotifRejet() {
        return motifRejet;
    }

    public Boolean getEstActive() {
        return estActive;
    }
}
