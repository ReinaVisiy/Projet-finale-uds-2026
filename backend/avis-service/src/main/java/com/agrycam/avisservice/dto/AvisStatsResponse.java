package com.agrycam.avisservice.dto;

public class AvisStatsResponse {
    private Double noteMoyenne;
    private Long nombreAvis;

    public AvisStatsResponse(Double noteMoyenne, Long nombreAvis) {
        this.noteMoyenne = noteMoyenne;
        this.nombreAvis = nombreAvis;
    }

    public Double getNoteMoyenne() {
        return noteMoyenne;
    }

    public void setNoteMoyenne(Double noteMoyenne) {
        this.noteMoyenne = noteMoyenne;
    }

    public Long getNombreAvis() {
        return nombreAvis;
    }

    public void setNombreAvis(Long nombreAvis) {
        this.nombreAvis = nombreAvis;
    }
}