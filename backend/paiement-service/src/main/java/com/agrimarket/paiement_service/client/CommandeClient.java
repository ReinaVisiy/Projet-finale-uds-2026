package com.agrimarket.paiement_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "commande-service", url = "${commande.service.url}")
public interface CommandeClient {
    @GetMapping("/api/commandes/{id}")
    CommandeDTO getCommandeById(@PathVariable("id") Long id);
}