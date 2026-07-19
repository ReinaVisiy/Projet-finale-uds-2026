package com.agrycam.messageservice.dto;

import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class MessageResponse {
    private final Long id;
    private final String contenu;
    private final LocalDateTime dateEnvoi;
    private final Boolean estLu;
    private final Boolean estDelivre;
    private final Long expediteurId;
    private final String expediteurNom;
    private final Long destinataireId;
    private final String destinataireNom;

    public MessageResponse(Long id, String contenu, LocalDateTime dateEnvoi, Boolean estLu, Boolean estDelivre,
                           Long expediteurId, String expediteurNom, Long destinataireId, String destinataireNom) {
        this.id = id;
        this.contenu = contenu;
        this.dateEnvoi = dateEnvoi;
        this.estLu = estLu;
        this.estDelivre = estDelivre;
        this.expediteurId = expediteurId;
        this.expediteurNom = expediteurNom;
        this.destinataireId = destinataireId;
        this.destinataireNom = destinataireNom;
    }
}
