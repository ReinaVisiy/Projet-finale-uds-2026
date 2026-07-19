package com.agriconnect.utilisateur_service.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CredentialsResponse {

    private Long uid;
    private String email;
    private String motDePasse;
    private List<String> roles;
    private LocalDateTime suspenduJusquau;

    public CredentialsResponse(Long uid, String email, String motDePasse, List<String> roles, LocalDateTime suspenduJusquau) {
        this.uid = uid;
        this.email = email;
        this.motDePasse = motDePasse;
        this.roles = roles;
        this.suspenduJusquau = suspenduJusquau;
    }

    public Long getUid() {
        return uid;
    }

    public String getEmail() {
        return email;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public List<String> getRoles() {
        return roles;
    }

    public LocalDateTime getSuspenduJusquau() {
        return suspenduJusquau;
    }
}
