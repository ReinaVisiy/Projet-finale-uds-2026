package com.agrycam.certificationservice.dto;

import com.agrycam.certificationservice.entity.TypeDocument;
import com.agrycam.certificationservice.entity.MoyenPaiement;
import java.math.BigDecimal;

public class CertificationRequest {

    private TypeDocument typeDocument;
    private String idRecto;
    private String idVerso;
    private String photoUtilisateur;
    private Integer dureeMois;
    private BigDecimal montant;
    private MoyenPaiement moyenPaiement;
    private String numeroPaiement;

    public CertificationRequest() {
    }

    public CertificationRequest(TypeDocument typeDocument, String idRecto, String idVerso, String photoUtilisateur, Integer dureeMois, BigDecimal montant, MoyenPaiement moyenPaiement, String numeroPaiement) {
        this.typeDocument = typeDocument;
        this.idRecto = idRecto;
        this.idVerso = idVerso;
        this.photoUtilisateur = photoUtilisateur;
        this.dureeMois = dureeMois;
        this.montant = montant;
        this.moyenPaiement = moyenPaiement;
        this.numeroPaiement = numeroPaiement;
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
}
