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
 * lorsqu'un paiement NotchPay est confirme (ou echoue) dans paiement-service.
 * Les appels sont authentifies par un token de service interne (voir
 * JwtUtil#genererTokenServiceInterne), car ces notifications se produisent
 * en arriere-plan (webhook NotchPay, sondage), sans requete utilisateur dont
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

    private static final int TENTATIVES_MAX = 3;
    private static final long DELAI_ENTRE_TENTATIVES_MS = 500;

    private void notifierCommande(Long commandeId, boolean paye) {
        // EN_ATTENTE est le statut que la commande porte deja depuis sa
        // creation (avant meme le paiement) : on le repose ici surtout pour
        // le cas d'echec/expiration -> ANNULEE. VALIDEE est desormais une
        // action reservee au VENDEUR (il accepte la commande) : la
        // confirmation de paiement ne doit plus la definir elle-meme.
        String nouveauStatut = paye ? "EN_ATTENTE" : "ANNULEE";

        // "paye=true" est le signal explicite qui declenche la
        // decrementation du stock cote commande-service (voir
        // CommandeService#updateStatutCommande) : distinct du statut
        // lui-meme, qui ne change pas forcement (EN_ATTENTE -> EN_ATTENTE).
        String url = UriComponentsBuilder.fromHttpUrl(commandeServiceUrl + "/api/commandes/" + commandeId + "/statut")
                .queryParam("statut", nouveauStatut)
                .queryParam("paye", paye)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
        HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

        // Quelques tentatives avec un court delai : un echec silencieux ici
        // laisserait la commande payee cote paiement-service sans que
        // commande-service (et donc le stock) ne le sache jamais, sans
        // aucun mecanisme de reconciliation pour ce cas precis.
        for (int tentative = 1; tentative <= TENTATIVES_MAX; tentative++) {
            try {
                restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
                log.info("Notification de commande-service : commande #{} -> statut={}, paye={} [tentative {}/{}]",
                        commandeId, nouveauStatut, paye, tentative, TENTATIVES_MAX);
                return;
            } catch (Exception e) {
                log.warn("Echec de la notification de commande-service pour la commande #{} [tentative {}/{}] : {}",
                        commandeId, tentative, TENTATIVES_MAX, e.getMessage());
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

        // Toutes les tentatives ont echoue : on relance pour que
        // l'appelant (notifierStatutPaiement) le journalise a son tour,
        // comme avant. La transaction de paiement reste correcte
        // independamment (source de verite via GET /statut-reference).
        throw new IllegalStateException(
                "Impossible de notifier commande-service pour la commande #" + commandeId + " apres " + TENTATIVES_MAX + " tentatives.");
    }
}
