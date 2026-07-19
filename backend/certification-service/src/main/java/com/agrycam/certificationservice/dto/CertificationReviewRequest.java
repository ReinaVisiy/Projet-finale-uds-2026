package com.agrycam.certificationservice.dto;

public class CertificationReviewRequest {

    private Boolean approuve;
    private String motifRejet;

    public CertificationReviewRequest() {
    }

    public CertificationReviewRequest(Boolean approuve, String motifRejet) {
        this.approuve = approuve;
        this.motifRejet = motifRejet;
    }

    public Boolean getApprouve() {
        return approuve;
    }

    public void setApprouve(Boolean approuve) {
        this.approuve = approuve;
    }

    public String getMotifRejet() {
        return motifRejet;
    }

    public void setMotifRejet(String motifRejet) {
        this.motifRejet = motifRejet;
    }
}
