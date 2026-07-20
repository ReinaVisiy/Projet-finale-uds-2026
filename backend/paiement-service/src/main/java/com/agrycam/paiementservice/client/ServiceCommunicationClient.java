package com.agrycam.paiementservice.client;

import com.agrycam.paiementservice.entity.TypeReference;
import com.agrycam.paiementservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.Map;

/**
 * Client charge de notifier certification-service et commande-service
 * lorsqu'un paiement Simiz est confirme (ou echoue) dans paiement-service.
 * Les appels sont authentifies par un token de service interne (voir
 * JwtUtil#genererTokenServiceInterne), car ces notifications se produisent
 * en arriere-plan (webhook Simiz, sondage), sans requete utilisateur dont
 * on pourrait propager le token JWT.
 * Toute erreur de communication est journalisee mais n'interrompt jamais
 * le traitement du paiement lui-meme (la transaction reste la source de
 * verite dans paiement-service, cf. GET /statut-reference).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ServiceCommunicationClient {

    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;

    @Value("${certification.service.url}")
    private String certificationServiceUrl;

    @Value("${commande.service.url}")
    private String commandeServiceUrl;

    /**
     * Notifie le service concerne (certification ou commande) qu'une
     * reference vient d'etre payee ou que son paiement a definitivement
     * echoue/expire.
     */
    public void notifierStatutPaiement(TypeReference typeReference, Long referenceId, boolean paye) {
        try {
            if (typeReference == TypeReference.CERTIFICATION) {
                notifierCertification(referenceId, paye);
            } else if (typeReference == TypeReference.COMMANDE) {
                notifierCommande(referenceId, paye);
            }
        } catch (Exception e) {
            // On ne relance jamais : la notification est une best-effort,
            // la transaction de paiement reste correcte independamment.
            log.error("Echec de la notification inter-services pour {} #{} (paye={}) : {}",
                    typeReference, referenceId, paye, e.getMessage());
        }
    }

    private void notifierCertification(Long certificationId, boolean paye) {
        String url = certificationServiceUrl + "/api/certifications/admin/" + certificationId + "/paiement";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());

        Map<String, Boolean> body = Collections.singletonMap("paye", paye);
        HttpEntity<Map<String, Boolean>> httpEntity = new HttpEntity<>(body, headers);

        log.info("Notification de certification-service : certification #{} -> paye={}", certificationId, paye);
        restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
    }

    private void notifierCommande(Long commandeId, boolean paye) {
        // EN_ATTENTE est le statut que la commande porte deja depuis sa
        // creation (avant meme le paiement) : on le repose ici surtout pour
        // le cas d'echec/expiration -> ANNULEE. VALIDEE est desormais une
        // action reservee au VENDEUR (il accepte la commande) : la
        // confirmation de paiement ne doit plus la definir elle-meme.
        String nouveauStatut = paye ? "EN_ATTENTE" : "ANNULEE";

        String url = UriComponentsBuilder.fromHttpUrl(commandeServiceUrl + "/api/commandes/" + commandeId + "/statut")
                .queryParam("statut", nouveauStatut)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
        HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

        log.info("Notification de commande-service : commande #{} -> statut={}", commandeId, nouveauStatut);
        restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
    }
}
