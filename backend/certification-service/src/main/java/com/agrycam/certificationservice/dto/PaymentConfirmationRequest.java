package com.agrycam.certificationservice.dto;

public class PaymentConfirmationRequest {

    private Boolean paye;

    public PaymentConfirmationRequest() {
    }

    public PaymentConfirmationRequest(Boolean paye) {
        this.paye = paye;
    }

    public Boolean getPaye() {
        return paye;
    }

    public void setPaye(Boolean paye) {
        this.paye = paye;
    }
}
