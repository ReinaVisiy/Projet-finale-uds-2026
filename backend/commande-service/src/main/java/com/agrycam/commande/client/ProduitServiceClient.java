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
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Client charge de notifier produit-service depuis commande-service, pour
 * repercuter une commande payee sur le stock reel des produits concernes.
 * Contrairement a PaiementServiceClient/ServiceCommunicationClient (qui
 * restent best-effort avec un simple log), cet appel utilise quelques
 * tentatives avec un court delai entre chacune : un echec silencieux ici
 * laisserait un stock incorrect indefiniment, sans mecanisme de
 * reconciliation existant pour le stock (contrairement au sequestre, qui
 * a le flag idempotent fondsLiberes cote paiement-service).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProduitServiceClient {

    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;

    @Value("${produit.service.url}")
    private String produitServiceUrl;

    private static final int TENTATIVES_MAX = 3;
    private static final long DELAI_ENTRE_TENTATIVES_MS = 500;

    /**
     * Decremente le stock d'un produit. Reessaie jusqu'a TENTATIVES_MAX fois
     * en cas d'echec (service temporairement indisponible, timeout reseau),
     * avec un court delai entre chaque tentative. Journalise une erreur si
     * toutes les tentatives echouent, mais ne relance jamais : la commande
     * elle-meme doit rester payee/confirmee independamment d'un souci de
     * stock qui devra alors etre corrige manuellement.
     */
    public void decrementerStock(Long produitId, int quantite) {
        String url = UriComponentsBuilder.fromHttpUrl(produitServiceUrl + "/api/produits/" + produitId + "/decrementer-stock")
                .queryParam("quantite", quantite)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
        HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

        for (int tentative = 1; tentative <= TENTATIVES_MAX; tentative++) {
            try {
                restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
                log.info("Stock decremente avec succes pour le produit #{} (-{}) [tentative {}/{}]",
                        produitId, quantite, tentative, TENTATIVES_MAX);
                return;
            } catch (Exception e) {
                log.warn("Echec de la decrementation du stock pour le produit #{} (-{}) [tentative {}/{}] : {}",
                        produitId, quantite, tentative, TENTATIVES_MAX, e.getMessage());
                if (tentative < TENTATIVES_MAX) {
                    try {
                        Thread.sleep(DELAI_ENTRE_TENTATIVES_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        log.error("Impossible de decrementer le stock du produit #{} (-{}) apres {} tentatives. "
                        + "Le stock de ce produit doit etre corrige manuellement.",
                produitId, quantite, TENTATIVES_MAX);
    }
}
