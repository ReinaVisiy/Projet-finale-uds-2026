package com.agrycam.messageservice.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class UtilisateurInfoDTO {
    private Long id;
    private String nom;
    private String email;
    private String adresse;
    private String role;
}