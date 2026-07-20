package com.agrycam.commande.client;

import com.agrycam.commande.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Client charge de notifier paiement-service depuis commande-service.
 * Miroir de ServiceCommunicationClient (paiement -> commande) : ici la
 * communication va dans l'autre sens, pour declencher la liberation du
 * sequestre lorsqu'une commande est confirmee livree.
 * Comme cote paiement-service, l'appel est authentifie par un token de
 * service interne et toute erreur est journalisee sans jamais faire
 * echouer la mise a jour du statut de la commande elle-meme.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaiementServiceClient {

    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;

    @Value("${paiement.service.url}")
    private String paiementServiceUrl;

    /**
     * Notifie paiement-service qu'une commande vient d'etre livree, pour
     * qu'il transfere le montant sequestre vers le solde disponible du
     * vendeur. Best-effort : un echec est journalise mais ne remonte pas,
     * la commande reste LIVREE independamment (le solde pourra etre
     * reconcilie manuellement si besoin).
     */
    public void notifierLivraison(Long commandeId) {
        try {
            String url = paiementServiceUrl + "/api/paiements/commandes/" + commandeId + "/liberer";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
            HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

            log.info("Notification de paiement-service : liberation du sequestre pour la commande #{}", commandeId);
            restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
        } catch (Exception e) {
            log.error("Echec de la notification de liberation du sequestre pour la commande #{} : {}",
                    commandeId, e.getMessage());
        }
    }
}
