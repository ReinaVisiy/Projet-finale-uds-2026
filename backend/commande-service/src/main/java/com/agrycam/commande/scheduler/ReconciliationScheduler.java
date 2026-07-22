package com.agrycam.commande.scheduler;

import com.agrycam.commande.client.PaiementServiceClient;
import com.agrycam.commande.model.Commande;
import com.agrycam.commande.model.StatutCommande;
import com.agrycam.commande.repository.CommandeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Filet de securite pour le groupe B, point 6 : le solde vendeur (retrait/
 * disponible) ne reflete pas toujours les commandes payees et livrees,
 * parce que la notification de liberation du sequestre
 * (PaiementServiceClient#notifierLivraison) est envoyee une seule fois au
 * moment de la livraison et peut echouer (service injoignable, timeout).
 * Meme avec les 3 tentatives ajoutees dans notifierLivraison, un echec
 * total reste possible.
 * Cette tache repasse periodiquement sur toutes les commandes LIVREE et
 * redemande la liberation du sequestre pour celles dont paiement-service
 * indique que ce n'est pas encore fait. L'operation cote paiement-service
 * (libererFondsSequestre) est deja idempotente (flag fondsLiberes), donc
 * redemander pour une commande deja reconciliee ne fait rien de plus.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReconciliationScheduler {

    private final CommandeRepository commandeRepository;
    private final PaiementServiceClient paiementServiceClient;

    @Scheduled(fixedRate = 2 * 60 * 60 * 1000) // toutes les 2 heures
    public void reconcilierSequestresNonLiberes() {
        List<Commande> commandesLivrees = commandeRepository.findByStatut(StatutCommande.LIVREE);

        int reconciliees = 0;
        for (Commande commande : commandesLivrees) {
            // null = statut indetermine (transaction introuvable, service
            // injoignable au moment du check) : on ne retente pas dans ce
            // cas, pour eviter de crier au loup sur une commande dont le
            // paiement n'a peut-etre jamais reellement abouti.
            Boolean fondsLiberes = paiementServiceClient.estFondsLiberes(commande.getId());
            if (Boolean.FALSE.equals(fondsLiberes)) {
                log.warn("Reconciliation : sequestre non libere detecte pour la commande LIVREE #{}. Nouvelle tentative.",
                        commande.getId());
                paiementServiceClient.notifierLivraison(commande.getId());
                reconciliees++;
            }
        }

        if (reconciliees > 0) {
            log.info("Reconciliation terminee : {} commande(s) LIVREE(s) avaient un sequestre non libere, nouvelle(s) tentative(s) effectuee(s).",
                    reconciliees);
        }
    }
}
