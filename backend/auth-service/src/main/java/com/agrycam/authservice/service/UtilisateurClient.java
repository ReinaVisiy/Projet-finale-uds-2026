package com.agrycam.authservice.service;

import com.agrycam.authservice.dto.IdentifiantsDTO;

public interface UtilisateurClient {
    IdentifiantsDTO getCredentialsByEmail(String email);
}