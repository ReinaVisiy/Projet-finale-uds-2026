package com.agrycam.paiementsimizservice.service;

import com.agrycam.paiementsimizservice.dto.*;
import com.agrycam.paiementsimizservice.entity.*;
import com.agrycam.paiementsimizservice.exception.SoldeInsuffisantException;
import com.agrycam.paiementsimizservice.exception.TransactionNotFoundException;
import com.agrycam.paiementsimizservice.repository.RetraitRepository;
import com.agrycam.paiementsimizservice.repository.SoldeVendeurRepository;
import com.agrycam.paiementsimizservice.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service metier gérant toutes les operations de paiement, de sequestre, de portefeuille vendeur,
 * d'integration de la passerelle Simiz et de retrait de fonds.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaiementService {

    private final TransactionRepository transactionRepository;
    private final SoldeVendeurRepository soldeVendeurRepository;
    private final RetraitRepository retraitRepository;
    private final RestTemplate restTemplate;

    @Value("${simiz.api.url}")
    private String simizApiUrl;

    @Value("${simiz.secret-key}")
    private String simizSecretKey;

    @Value("${simiz.public-key}")
    private String simizPublicKey;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Initie un paiement cote client.
     * Calcule la commission fixe de 5%, le montant net vendeur,
     * et cree une session de checkout avec Simiz.
     */
    @Transactional
    public Transaction initierPaiement(InitiationPaiementDTO dto, Long clientId) {
        log.info("Initiation de paiement pour le client {}, type: {}, refId: {}, montant: {}",
                clientId, dto.getTypeReference(), dto.getReferenceId(), dto.getMontant());

        // 1. Calculs financiers
        BigDecimal montantTotal = dto.getMontant();
        BigDecimal commission = montantTotal.multiply(new BigDecimal("0.05")); // 5% de commission plateforme
        BigDecimal montantNet = montantTotal.subtract(commission); // 95% pour le vendeur

        // 2. Creation de la transaction en statut EN_ATTENTE
        Transaction transaction = Transaction.builder()
                .clientId(clientId)
                .montant(montantTotal)
                .commission(commission)
                .montantNet(montantNet)
                .devise("XAF")
                .typeReference(dto.getTypeReference())
                .referenceId(dto.getReferenceId())
                .vendeurId(dto.getVendeurId())
                .statut(StatutTransaction.EN_ATTENTE)
                .build();

        // On sauvegarde temporairement pour obtenir l'ID de notre transaction locale
        transaction = transactionRepository.save(transaction);

        // 3. Appel a la passerelle de paiement Simiz (sandbox)
        String description = String.format("Paiement AgryCam - %s #%d", dto.getTypeReference(), dto.getReferenceId());
        
        // URLs de retour
        String successUrl = String.format("%s/pay/success?transactionId=%d", frontendUrl, transaction.getId());
        String cancelUrl = String.format("%s/pay/cancel?transactionId=%d", frontendUrl, transaction.getId());

        Map<String, String> metadata = new HashMap<>();
        metadata.put("transactionId", transaction.getId().toString());
        metadata.put("typeReference", dto.getTypeReference().name());
        metadata.put("referenceId", dto.getReferenceId().toString());
        metadata.put("vendeurId", dto.getVendeurId().toString());

        SimizCheckoutRequest checkoutRequest = SimizCheckoutRequest.builder()
                .amount(montantTotal)
                .currency("XAF")
                .description(description)
                .successUrl(successUrl)
                .cancelUrl(cancelUrl)
                .metadata(metadata)
                .build();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(simizSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<SimizCheckoutRequest> httpEntity = new HttpEntity<>(checkoutRequest, headers);
            
            log.info("Appel de Simiz API sur {}/checkout pour initiation", simizApiUrl);
            ResponseEntity<SimizCheckoutResponse> responseEntity = restTemplate.postForEntity(
                    simizApiUrl + "/checkout", 
                    httpEntity, 
                    SimizCheckoutResponse.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                SimizCheckoutResponse simizResponse = responseEntity.getBody();
                transaction.setSimizSessionId(simizResponse.getId());
                transaction.setSimizCheckoutUrl(simizResponse.getCheckoutUrl());
                log.info("Session de paiement Simiz creee avec succes. SessionID: {}", simizResponse.getId());
            } else {
                throw new IllegalStateException("Reponse invalide de Simiz");
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'appel de l'API Simiz : {}", e.getMessage());
            // Mode de secours / Simulation locale robuste en cas d'erreur reseau ou si la clef Simiz n'est pas configuree
            String mockSessionId = "simiz_pay_mock_" + UUID.randomUUID().toString().substring(0, 8);
            String mockCheckoutUrl = "https://checkout.simiz.io/pay/mock_" + transaction.getId();
            transaction.setSimizSessionId(mockSessionId);
            transaction.setSimizCheckoutUrl(mockCheckoutUrl);
            log.warn("Utilisation d'une session de paiement factice de secours : {}", mockSessionId);
        }

        return transactionRepository.save(transaction);
    }

    /**
     * Verifie le statut d'un paiement en interrogeant directement l'API Simiz (sondage/polling).
     * Si le statut est passe a PAYE, credite automatiquement le solde du vendeur (sequestre libere).
     * Methode synchronisee pour eviter les conditions de concurrence et les double-credits de solde.
     */
    @Transactional
    public synchronized Transaction verifierPaiement(Long id) {
        log.info("Verification de la transaction {} via Simiz API (polling)...", id);
        
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("La transaction de paiement #" + id + " n'existe pas."));

        // Si la transaction est deja traitee (PAYE ou ECHOUE), on ne fait rien de plus pour securiser les fonds
        if (transaction.getStatut() == StatutTransaction.PAYE) {
            log.info("La transaction {} est deja en statut PAYE. Aucun re-credit necessaire.", id);
            return transaction;
        }
        if (transaction.getStatut() == StatutTransaction.ECHOUE || transaction.getStatut() == StatutTransaction.EXPIRE) {
            log.info("La transaction {} est deja terminee avec un statut final: {}", id, transaction.getStatut());
            return transaction;
        }

        String sessionId = transaction.getSimizSessionId();
        if (sessionId == null) {
            log.error("Aucun SimizSessionId associe a la transaction {}", id);
            return transaction;
        }

        // Interroger l'API Simiz
        String remoteStatus = "PENDING";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(simizSecretKey);
            HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

            String url = String.format("%s/payments/%s", simizApiUrl, sessionId);
            log.info("Appel de Simiz API sur {}", url);
            ResponseEntity<SimizPaymentStatusResponse> responseEntity = restTemplate.exchange(
                    url,
                    org.springframework.http.HttpMethod.GET,
                    httpEntity,
                    SimizPaymentStatusResponse.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                remoteStatus = responseEntity.getBody().getStatus();
                log.info("Statut retourne par Simiz pour la session {}: {}", sessionId, remoteStatus);
            }
        } catch (Exception e) {
            log.error("Impossible de joindre l'API Simiz pour verifier le paiement de la session {}: {}. Statut inchange.",
                    sessionId, e.getMessage());
            // Dans le cadre du simulateur de developpement, si l'appel Simiz echoue parce qu'il n'y a pas de vraie connexion internet,
            // on conserve le statut courant sans faire planter le service.
        }

        // Mettre a jour la transaction locale
        if ("SUCCESSFUL".equalsIgnoreCase(remoteStatus) || "PAID".equalsIgnoreCase(remoteStatus) || "SUCCESS".equalsIgnoreCase(remoteStatus)) {
            confirmerPaiementInterne(transaction);
        } else if ("FAILED".equalsIgnoreCase(remoteStatus) || "FAILURE".equalsIgnoreCase(remoteStatus)) {
            transaction.setStatut(StatutTransaction.ECHOUE);
            transactionRepository.save(transaction);
            log.warn("Paiement Simiz echoue pour la transaction {}", id);
        } else if ("EXPIRED".equalsIgnoreCase(remoteStatus)) {
            transaction.setStatut(StatutTransaction.EXPIRE);
            transactionRepository.save(transaction);
            log.info("Session de paiement Simiz expiree pour la transaction {}", id);
        }

        return transaction;
    }

    /**
     * Confirme le paiement et credite le solde du vendeur concerne.
     * Cette methode interne doit s'exécuter dans la transaction active.
     */
    private void confirmerPaiementInterne(Transaction transaction) {
        transaction.setStatut(StatutTransaction.PAYE);
        transaction.setDateConfirmation(LocalDateTime.now());
        transactionRepository.save(transaction);

        // Crediter le solde du vendeur (Montant net = 95%)
        Long vendeurId = transaction.getVendeurId();
        BigDecimal montantNet = transaction.getMontantNet();

        SoldeVendeur solde = soldeVendeurRepository.findByVendeurId(vendeurId)
                .orElseGet(() -> SoldeVendeur.builder()
                        .vendeurId(vendeurId)
                        .solde(BigDecimal.ZERO)
                        .devise("XAF")
                        .build());

        solde.setSolde(solde.getSolde().add(montantNet));
        soldeVendeurRepository.save(solde);

        log.info("Portefeuille du vendeur {} credite avec succes du montant net de {} XAF (Transaction #{})",
                vendeurId, montantNet, transaction.getId());
    }

    /**
     * Traite le webhook passif envoye par Simiz.
     * Valide le paiement de maniere securisee en interrogeant l'API Simiz pour eviter tout spoofing de requete.
     */
    @Transactional
    public void traiterWebhookSimiz(Map<String, Object> payload) {
        log.info("Reception d'un Webhook de Simiz: {}", payload);
        
        String sessionId = null;
        if (payload.containsKey("id")) {
            sessionId = (String) payload.get("id");
        } else if (payload.containsKey("sessionId")) {
            sessionId = (String) payload.get("sessionId");
        } else if (payload.containsKey("paymentId")) {
            sessionId = (String) payload.get("paymentId");
        }

        if (sessionId == null) {
            log.warn("Le payload du Webhook ne contient aucun identifiant de session ou paiement exploitable.");
            return;
        }

        Transaction transaction = transactionRepository.findBySimizSessionId(sessionId)
                .orElse(null);

        if (transaction == null) {
            log.warn("Aucune transaction correspondante trouvee pour le SimizSessionId: {}", sessionId);
            return;
        }

        // Pour une securite maximale, au lieu de faire aveuglément confiance au payload du webhook,
        // on declenche notre methode verifierPaiement qui interroge directement l'API Simiz via un canal securise de confiance.
        verifierPaiement(transaction.getId());
    }

    /**
     * Recupere le portefeuille (solde) d'un vendeur.
     */
    @Transactional
    public SoldeVendeur recupererSoldeVendeur(Long vendeurId) {
        return soldeVendeurRepository.findByVendeurId(vendeurId)
                .orElseGet(() -> {
                    SoldeVendeur nouveauSolde = SoldeVendeur.builder()
                            .vendeurId(vendeurId)
                            .solde(BigDecimal.ZERO)
                            .devise("XAF")
                            .build();
                    return soldeVendeurRepository.save(nouveauSolde);
                });
    }

    /**
     * Recupere les transactions d'un vendeur.
     */
    public List<Transaction> recupererTransactionsVendeur(Long vendeurId) {
        return transactionRepository.findByVendeurId(vendeurId);
    }

    /**
     * Recupere toutes les transactions (Role Admin).
     */
    public List<Transaction> recupererToutesTransactions() {
        return transactionRepository.findAll();
    }

    /**
     * Traite une demande de retrait d'un vendeur (retrait simule en base).
     * Verifie le solde disponible, decremente, et enregistre l'historique de retrait.
     */
    @Transactional
    public Retrait demanderRetrait(Long vendeurId, BigDecimal montant) {
        log.info("Demande de retrait initiee par le vendeur {} pour un montant de {}", vendeurId, montant);

        if (montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le montant du retrait doit etre strictement superieur a 0.");
        }

        SoldeVendeur soldeVendeur = soldeVendeurRepository.findByVendeurId(vendeurId)
                .orElseThrow(() -> new SoldeInsuffisantException("Portefeuille vendeur inexistant. Retrait impossible."));

        if (soldeVendeur.getSolde().compareTo(montant) < 0) {
            throw new SoldeInsuffisantException(String.format("Solde insuffisant pour retirer %s XAF. Votre solde disponible est de %s XAF.",
                    montant, soldeVendeur.getSolde()));
        }

        // Decrementer le solde
        soldeVendeur.setSolde(soldeVendeur.getSolde().subtract(montant));
        soldeVendeurRepository.save(soldeVendeur);

        // Generer la reference factice du reçu de virement
        String referencePaiement = "PAYOUT-" + UUID.randomUUID().toString().toUpperCase();

        Retrait retrait = Retrait.builder()
                .vendeurId(vendeurId)
                .montant(montant)
                .referencePaiement(referencePaiement)
                .statut("COMPLETE")
                .build();

        retrait = retraitRepository.save(retrait);
        log.info("Retrait de {} XAF enregistre avec succes pour le vendeur {}. Reference: {}",
                montant, vendeurId, referencePaiement);

        return retrait;
    }

    /**
     * Recupere l'historique des retraits d'un vendeur.
     */
    public List<Retrait> recupererRetraitsVendeur(Long vendeurId) {
        return retraitRepository.findByVendeurId(vendeurId);
    }

    /**
     * Recupere l'état de paiement d'un element (Commande ou Certification) lie.
     * Utile pour la communication inter-services (ou frontend).
     */
    public Map<String, Object> recupererStatutReference(TypeReference type, Long referenceId) {
        Transaction transaction = transactionRepository.findByTypeReferenceAndReferenceId(type, referenceId)
                .orElse(null);

        Map<String, Object> statutMap = new HashMap<>();
        statutMap.put("typeReference", type);
        statutMap.put("referenceId", referenceId);

        if (transaction == null) {
            statutMap.put("statutPaiement", "NON_INITIE");
            statutMap.put("paye", false);
        } else {
            statutMap.put("transactionId", transaction.getId());
            statutMap.put("statutPaiement", transaction.getStatut().name());
            statutMap.put("paye", transaction.getStatut() == StatutTransaction.PAYE);
            statutMap.put("montant", transaction.getMontant());
            statutMap.put("dateConfirmation", transaction.getDateConfirmation());
        }

        return statutMap;
    }
}
