package com.agrycam.commande.scheduler;

import com.agrycam.commande.service.CommandeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tache planifiee qui auto-confirme la livraison des commandes EXPEDIEE
 * depuis plus de 72h sans confirmation manuelle du client (cf. cycle de
 * vie de la commande, section 2 du cahier des charges).
 * S'execute toutes les heures : suffisant pour un delai de 72h, sans
 * surcharger la base de donnees.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LivraisonScheduler {

    private final CommandeService commandeService;

    @Scheduled(fixedRate = 60 * 60 * 1000) // toutes les heures
    public void autoConfirmerLivraisons() {
        int nombreConfirmees = commandeService.autoConfirmerLivraisonsExpirees();
        if (nombreConfirmees > 0) {
            log.info("{} commande(s) auto-confirmee(s) LIVREE apres 72h sans action du client.", nombreConfirmees);
        }
    }
}
