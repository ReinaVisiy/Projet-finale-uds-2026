package com.agrycam.certificationservice.dto;

import com.agrycam.certificationservice.entity.MoyenPaiement;

public class PaymentInformationResponse {

    private MoyenPaiement operateur;
    private String numeroPaiement;

    public PaymentInformationResponse() {
    }

    public PaymentInformationResponse(MoyenPaiement operateur, String numeroPaiement) {
        this.operateur = operateur;
        this.numeroPaiement = numeroPaiement;
    }

    public MoyenPaiement getOperateur() {
        return operateur;
    }

    public void setOperateur(MoyenPaiement operateur) {
        this.operateur = operateur;
    }

    public String getNumeroPaiement() {
        return numeroPaiement;
    }

    public void setNumeroPaiement(String numeroPaiement) {
        this.numeroPaiement = numeroPaiement;
    }
}
