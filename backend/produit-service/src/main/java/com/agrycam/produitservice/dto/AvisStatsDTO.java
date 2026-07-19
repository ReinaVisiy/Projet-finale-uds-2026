package com.agrycam.produitservice.dto;

public class AvisStatsDTO {

    private Double noteMoyenne;
    private Long nombreAvis;

    public AvisStatsDTO() {
    }

    public AvisStatsDTO(Double noteMoyenne, Long nombreAvis) {
        this.noteMoyenne = noteMoyenne;
        this.nombreAvis = nombreAvis;
    }

    public Double getNoteMoyenne() { return noteMoyenne; }
    public void setNoteMoyenne(Double noteMoyenne) { this.noteMoyenne = noteMoyenne; }

    public Long getNombreAvis() { return nombreAvis; }
    public void setNombreAvis(Long nombreAvis) { this.nombreAvis = nombreAvis; }
}