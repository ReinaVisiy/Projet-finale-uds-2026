package com.agrimarket.paiement_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "utilisateur-service", url = "${utilisateur.service.url}")
public interface UtilisateurClient {
    @GetMapping("/api/utilisateurs/{id}")
    UtilisateurDTO getUtilisateurById(@PathVariable("id") Long id);
}