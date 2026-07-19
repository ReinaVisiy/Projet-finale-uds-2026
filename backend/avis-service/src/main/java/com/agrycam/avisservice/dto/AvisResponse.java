package com.agrycam.avisservice.dto;

import java.time.LocalDate;

public class AvisResponse {

    private Long id;
    private Integer note;
    private String commentaire;
    private LocalDate date;
    private Long clientId;
    private String clientNom;  // TODO: Will be populated from auth-service API call in future
    private Long produitId;

    public AvisResponse() {
    }

    public AvisResponse(Long id, Integer note, String commentaire, LocalDate date,
                        Long clientId, String clientNom, Long produitId) {
        this.id = id;
        this.note = note;
        this.commentaire = commentaire;
        this.date = date;
        this.clientId = clientId;
        this.clientNom = clientNom;
        this.produitId = produitId;
    }

    public Long getId() { return id; }
    public Integer getNote() { return note; }
    public String getCommentaire() { return commentaire; }
    public LocalDate getDate() { return date; }
    public Long getClientId() { return clientId; }
    public String getClientNom() { return clientNom; }
    public Long getProduitId() { return produitId; }
}
