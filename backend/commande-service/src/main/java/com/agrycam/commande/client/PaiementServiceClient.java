package com.agrycam.commande.client;

import com.agrycam.commande.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

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

    private static final int TENTATIVES_MAX = 3;
    private static final long DELAI_ENTRE_TENTATIVES_MS = 500;

    /**
     * Notifie paiement-service qu'une commande vient d'etre livree, pour
     * qu'il transfere le montant sequestre vers le solde disponible du
     * vendeur. Reessaie quelques fois en cas d'echec transitoire ; si tout
     * echoue, c'est journalise en erreur mais ne remonte pas (la commande
     * reste LIVREE independamment). ReconciliationScheduler rattrape
     * ensuite periodiquement les cas ou meme ces tentatives ont echoue
     * (cf. groupe B, point 6 : solde vendeur bloque en sequestre).
     */
    public void notifierLivraison(Long commandeId) {
        String url = paiementServiceUrl + "/api/paiements/commandes/" + commandeId + "/liberer";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
        HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

        for (int tentative = 1; tentative <= TENTATIVES_MAX; tentative++) {
            try {
                restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
                log.info("Notification de paiement-service : liberation du sequestre pour la commande #{} [tentative {}/{}]",
                        commandeId, tentative, TENTATIVES_MAX);
                return;
            } catch (Exception e) {
                log.warn("Echec de la liberation du sequestre pour la commande #{} [tentative {}/{}] : {}",
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

        log.error("Impossible de liberer le sequestre pour la commande #{} apres {} tentatives. "
                        + "ReconciliationScheduler retentera lors de son prochain passage.",
                commandeId, TENTATIVES_MAX);
    }

    /**
     * Notifie paiement-service qu'une commande vient d'etre annulee (avant
     * expedition), pour qu'il declenche le remboursement 90% client / 10%
     * frais plateforme et debite le sequestre du vendeur. Best-effort, au
     * meme titre que notifierLivraison.
     */
    public void notifierAnnulation(Long commandeId) {
        try {
            String url = paiementServiceUrl + "/api/paiements/commandes/" + commandeId + "/rembourser-annulation";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
            HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

            log.info("Notification de paiement-service : remboursement d'annulation pour la commande #{}", commandeId);
            restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
        } catch (Exception e) {
            log.error("Echec de la notification de remboursement d'annulation pour la commande #{} : {}",
                    commandeId, e.getMessage());
        }
    }

    /**
     * Notifie paiement-service qu'une commande vient d'etre rejetee par le
     * vendeur (avant validation), pour qu'il declenche le remboursement
     * integral (100%) au client, debite le sequestre du vendeur, et reprenne
     * la commission plateforme deja creditee sur cette transaction (la
     * vente n'a jamais eu lieu). Best-effort, au meme titre que
     * notifierAnnulation.
     */
    public void notifierRejet(Long commandeId) {
        try {
            String url = paiementServiceUrl + "/api/paiements/commandes/" + commandeId + "/rembourser-rejet";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
            HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

            log.info("Notification de paiement-service : remboursement de rejet pour la commande #{}", commandeId);
            restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
        } catch (Exception e) {
            log.error("Echec de la notification de remboursement de rejet pour la commande #{} : {}",
                    commandeId, e.getMessage());
        }
    }

    /**
     * Interroge paiement-service pour savoir si le sequestre d'une commande
     * a deja ete libere vers le solde disponible du vendeur. Utilise par
     * LitigeService pour calculer le flag "fonds deja retires" qui
     * conditionne le remboursement en un clic d'un litige. Retourne null
     * si le statut est indetermine (transaction inexistante, service
     * injoignable) : l'appelant doit alors traiter le cas avec prudence
     * (ne pas proposer le remboursement automatique).
     */
    public Boolean estFondsLiberes(Long commandeId) {
        try {
            String url = paiementServiceUrl + "/api/paiements/statut/COMMANDE/" + commandeId;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
            HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

            ResponseEntity<Map> reponse = restTemplate.exchange(url, HttpMethod.GET, httpEntity, Map.class);
            Object valeur = reponse.getBody() != null ? reponse.getBody().get("fondsLiberes") : null;
            return valeur instanceof Boolean ? (Boolean) valeur : null;
        } catch (Exception e) {
            log.error("Echec de la verification de liberation de sequestre pour la commande #{} : {}",
                    commandeId, e.getMessage());
            return null;
        }
    }

    /**
     * Notifie paiement-service qu'un litige "Produit non livré" vient
     * d'etre resolu par un admin via remboursement en un clic : declenche
     * le remboursement integral (100%) au client et le debit du sequestre
     * du vendeur. Propage l'exception (contrairement aux autres methodes
     * de ce client) car l'admin doit voir immediatement si le
     * remboursement a echoue (ex. fonds deja liberes).
     */
    public void notifierRemboursementLitige(Long commandeId) {
        String url = paiementServiceUrl + "/api/paiements/commandes/" + commandeId + "/rembourser-litige";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtUtil.genererTokenServiceInterne());
        HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

        log.info("Notification de paiement-service : remboursement de litige pour la commande #{}", commandeId);
        restTemplate.exchange(url, HttpMethod.PUT, httpEntity, Void.class);
    }
}
