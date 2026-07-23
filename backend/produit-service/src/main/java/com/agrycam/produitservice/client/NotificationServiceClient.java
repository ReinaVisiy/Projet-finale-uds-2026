package com.agrycam.produitservice.client;

import com.agrycam.produitservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Client charge d'envoyer des notifications a notification-service depuis
 * produit-service (ex. alerte de stock critique a destination du
 * producteur). Authentifie par un token de service interne, car ces
 * appels se produisent en arriere-plan (suite a un appel de
 * commande-service), sans requete utilisateur dont on pourrait propager
 * le token JWT.
 * Sur le modele de ServiceCommunicationClient (paiement-service) : une
 * erreur d'envoi est journalisee mais n'interrompt jamais le traitement
 * du stock lui-meme, qui reste la source de verite.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceClient {

    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    public void envoyerAlerteStockCritique(Long producteurId, Long produitId, String nomProduit, int stockActuel) {
        try {
            String url = notificationServiceUrl + "/api/notifications";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());

            Map<String, Object> body = Map.of(
                    "destinataireId", producteurId,
                    "type", "STOCK",
                    "niveau", "AVERTISSEMENT",
                    "titre", "Stock critique : " + nomProduit,
                    "contenu", "Le stock de \"" + nomProduit + "\" est descendu a " + stockActuel
                            + " unite(s). Pensez a le reapprovisionner pour eviter une rupture.",
                    "lien", "/stock-alerts"
            );

            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, httpEntity, Void.class);

            log.info("Alerte de stock critique envoyee pour le produit #{} (producteur #{}, stock={})",
                    produitId, producteurId, stockActuel);
        } catch (Exception e) {
            // Best-effort : un echec d'envoi ne doit jamais faire echouer
            // la decrementation du stock elle-meme.
            log.error("Echec de l'envoi de l'alerte de stock critique pour le produit #{} : {}",
                    produitId, e.getMessage());
        }
    }
}
