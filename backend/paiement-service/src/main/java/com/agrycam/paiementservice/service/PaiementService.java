package com.agrycam.paiementservice.service;

import com.agrycam.paiementservice.client.ServiceCommunicationClient;
import com.agrycam.paiementservice.dto.*;
import com.agrycam.paiementservice.entity.*;
import com.agrycam.paiementservice.exception.SoldeInsuffisantException;
import com.agrycam.paiementservice.exception.TransactionNotFoundException;
import com.agrycam.paiementservice.repository.RetraitRepository;
import com.agrycam.paiementservice.repository.SoldeVendeurRepository;
import com.agrycam.paiementservice.repository.TransactionRepository;
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
    private final ServiceCommunicationClient serviceCommunicationClient;

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

        // URLs de retour (page cote frontend qui affiche le resultat au client)
        String returnUrl = String.format("%s/pay/success?transactionId=%d", frontendUrl, transaction.getId());
        String cancelUrl = String.format("%s/pay/cancel?transactionId=%d", frontendUrl, transaction.getId());

        // Simiz exige un userId au format UUID ; notre clientId est un Long,
        // donc on derive un UUID stable et reproductible a partir de celui-ci
        // (uniquement pour l'identification cote Simiz).
        UUID simizUserId = UUID.nameUUIDFromBytes(("agrycam-client-" + clientId).getBytes());

        SimizCheckoutRequest checkoutRequest = SimizCheckoutRequest.builder()
                .userId(simizUserId)
                .amount(montantTotal)
                .currency("XAF")
                .description(description)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .build();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(simizSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<SimizCheckoutRequest> httpEntity = new HttpEntity<>(checkoutRequest, headers);

            // Le bon endpoint de creation est POST /payments (et non /checkout,
            // qui n'existe pas dans l'API Simiz : c'etait la cause du bug de
            // redirection vers une page inexistante).
            log.info("Appel de Simiz API sur {}/payments pour initiation", simizApiUrl);
            ResponseEntity<SimizCheckoutResponse> responseEntity = restTemplate.postForEntity(
                    simizApiUrl + "/payments",
                    httpEntity,
                    SimizCheckoutResponse.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                SimizCheckoutResponse simizResponse = responseEntity.getBody();
                transaction.setSimizSessionId(simizResponse.getToken());
                transaction.setSimizCheckoutUrl(simizResponse.getPaymentUrl());
                log.info("Paiement Simiz cree avec succes. Token: {}", simizResponse.getToken());
            } else {
                throw new IllegalStateException("Reponse invalide de Simiz");
            }
        } catch (Exception e) {
            // On ne genere plus d'URL de paiement factice : une fausse URL
            // menait le client vers une page inexistante (cf. bug remonte en
            // test). Si Simiz est injoignable ou mal configure, l'initiation
            // echoue clairement plutot que de simuler un faux succes.
            log.error("Erreur lors de l'appel de l'API Simiz : {}", e.getMessage());
            transaction.setStatut(StatutTransaction.ECHOUE);
            transactionRepository.save(transaction);
            throw new IllegalStateException(
                    "Impossible d'initier le paiement aupres de Simiz. Reessayez plus tard.", e);
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

            // GET /payments/{token}/verify : re-verifie le statut aupres du
            // fournisseur Mobile Money (plus fiable qu'une simple lecture en
            // cas de webhook manque). "sessionId" contient en realite le
            // token Simiz (cf. initierPaiement).
            String url = String.format("%s/payments/%s/verify", simizApiUrl, sessionId);
            log.info("Appel de Simiz API sur {}", url);
            ResponseEntity<SimizPaymentStatusResponse> responseEntity = restTemplate.exchange(
                    url,
                    org.springframework.http.HttpMethod.GET,
                    httpEntity,
                    SimizPaymentStatusResponse.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                remoteStatus = responseEntity.getBody().getStatus();
                log.info("Statut retourne par Simiz pour le token {}: {}", sessionId, remoteStatus);
            }
        } catch (Exception e) {
            log.error("Impossible de joindre l'API Simiz pour verifier le paiement du token {}: {}. Statut inchange.",
                    sessionId, e.getMessage());
            // Dans le cadre du simulateur de developpement, si l'appel Simiz echoue parce qu'il n'y a pas de vraie connexion internet,
            // on conserve le statut courant sans faire planter le service.
        }

        // Mettre a jour la transaction locale.
        // Valeurs reelles renvoyees par Simiz : PENDING, PROCESSING, COMPLETED,
        // FAILED, CANCELLED, EXPIRED, REFUNDED, PARTIALLY_REFUNDED.
        if ("COMPLETED".equalsIgnoreCase(remoteStatus)) {
            confirmerPaiementInterne(transaction);
        } else if ("FAILED".equalsIgnoreCase(remoteStatus) || "CANCELLED".equalsIgnoreCase(remoteStatus)) {
            transaction.setStatut(StatutTransaction.ECHOUE);
            transactionRepository.save(transaction);
            log.warn("Paiement Simiz echoue pour la transaction {}", id);
            serviceCommunicationClient.notifierStatutPaiement(
                    transaction.getTypeReference(), transaction.getReferenceId(), false);
        } else if ("EXPIRED".equalsIgnoreCase(remoteStatus)) {
            transaction.setStatut(StatutTransaction.EXPIRE);
            transactionRepository.save(transaction);
            log.info("Session de paiement Simiz expiree pour la transaction {}", id);
            serviceCommunicationClient.notifierStatutPaiement(
                    transaction.getTypeReference(), transaction.getReferenceId(), false);
        }
        // PENDING / PROCESSING : aucun changement, le sondage cote frontend continuera.

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

        // Crediter le SEQUESTRE du vendeur (Montant net = 95%) : les fonds
        // restent verrouilles tant que la commande n'est pas LIVREE. Ils ne
        // deviennent retirables (soldeDisponible) qu'a la livraison
        // confirmee (cf. libererFondsSequestre, declenche par commande-service).
        Long vendeurId = transaction.getVendeurId();
        BigDecimal montantNet = transaction.getMontantNet();

        SoldeVendeur solde = soldeVendeurRepository.findByVendeurId(vendeurId)
                .orElseGet(() -> SoldeVendeur.builder()
                        .vendeurId(vendeurId)
                        .soldeSequestre(BigDecimal.ZERO)
                        .soldeDisponible(BigDecimal.ZERO)
                        .devise("XAF")
                        .build());

        solde.setSoldeSequestre(solde.getSoldeSequestre().add(montantNet));
        soldeVendeurRepository.save(solde);

        log.info("Sequestre du vendeur {} credite avec succes du montant net de {} XAF (Transaction #{}) - verrouille jusqu'a livraison",
                vendeurId, montantNet, transaction.getId());

        // Repercute la confirmation de paiement sur le service concerne
        // (commande-service ou certification-service), pour que son propre
        // statut (VALIDEE / paiement PAYE) reste synchronise avec la
        // transaction reellement confirmee cote Simiz.
        serviceCommunicationClient.notifierStatutPaiement(
                transaction.getTypeReference(), transaction.getReferenceId(), true);
    }

    /**
     * Libere le sequestre d'une commande vers le solde disponible du vendeur.
     * Declenche par commande-service lorsqu'une commande passe a LIVREE
     * (confirmation client ou auto-confirmation apres 72h).
     * Idempotent : si les fonds ont deja ete liberes pour cette commande,
     * l'appel est ignore silencieusement (retry-safe).
     */
    @Transactional
    public synchronized void libererFondsSequestre(Long commandeId) {
        Transaction transaction = transactionRepository
                .findByTypeReferenceAndReferenceId(TypeReference.COMMANDE, commandeId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "Aucune transaction de paiement trouvee pour la commande #" + commandeId));

        if (transaction.getStatut() != StatutTransaction.PAYE) {
            log.warn("Liberation de sequestre demandee pour la commande {} dont la transaction n'est pas PAYE (statut: {}). Ignoree.",
                    commandeId, transaction.getStatut());
            return;
        }

        if (transaction.isFondsLiberes()) {
            log.info("Sequestre deja libere pour la commande {}. Appel ignore (idempotence).", commandeId);
            return;
        }

        SoldeVendeur solde = soldeVendeurRepository.findByVendeurId(transaction.getVendeurId())
                .orElseThrow(() -> new SoldeInsuffisantException(
                        "Portefeuille introuvable pour le vendeur " + transaction.getVendeurId()));

        BigDecimal montantNet = transaction.getMontantNet();
        solde.setSoldeSequestre(solde.getSoldeSequestre().subtract(montantNet));
        solde.setSoldeDisponible(solde.getSoldeDisponible().add(montantNet));
        soldeVendeurRepository.save(solde);

        transaction.setFondsLiberes(true);
        transactionRepository.save(transaction);

        log.info("Sequestre libere pour la commande {} : {} XAF transferes vers le solde disponible du vendeur {}",
                commandeId, montantNet, transaction.getVendeurId());
    }

    /**
     * Traite le remboursement lie a l'annulation d'une commande (uniquement
     * autorisee par commande-service avant expedition) : 90% du montant
     * total est rembourse au client, 10% retenu par la plateforme comme
     * frais d'annulation. Le sequestre du vendeur (qui n'a jamais eu droit
     * a ces fonds puisque la vente n'a pas ete honoree) est integralement
     * debite.
     * Simulateur : aucun virement reel n'est effectue vers le client (pas
     * de portefeuille client dans ce systeme) ; les montants sont
     * uniquement enregistres sur la transaction a des fins d'audit/admin.
     * Idempotent comme libererFondsSequestre.
     */
    @Transactional
    public synchronized void traiterRemboursementAnnulation(Long commandeId) {
        Transaction transaction = transactionRepository
                .findByTypeReferenceAndReferenceId(TypeReference.COMMANDE, commandeId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "Aucune transaction de paiement trouvee pour la commande #" + commandeId));

        if (transaction.getStatut() != StatutTransaction.PAYE) {
            log.warn("Remboursement demande pour la commande {} dont la transaction n'est pas PAYE (statut: {}). Ignoree.",
                    commandeId, transaction.getStatut());
            return;
        }

        if (transaction.isFondsLiberes()) {
            log.error("Remboursement demande pour la commande {} dont le sequestre a deja ete libere. Incoherence : une commande livree ne devrait plus pouvoir etre annulee.",
                    commandeId);
            return;
        }

        SoldeVendeur solde = soldeVendeurRepository.findByVendeurId(transaction.getVendeurId())
                .orElseThrow(() -> new SoldeInsuffisantException(
                        "Portefeuille introuvable pour le vendeur " + transaction.getVendeurId()));

        // Debite integralement le sequestre : ces fonds ne reviennent pas
        // au vendeur puisque la commande est annulee.
        solde.setSoldeSequestre(solde.getSoldeSequestre().subtract(transaction.getMontantNet()));
        soldeVendeurRepository.save(solde);

        BigDecimal montantRembourseClient = transaction.getMontant().multiply(new BigDecimal("0.90"));
        BigDecimal fraisAnnulation = transaction.getMontant().subtract(montantRembourseClient);

        transaction.setMontantRembourseClient(montantRembourseClient);
        transaction.setFraisAnnulation(fraisAnnulation);
        transaction.setStatut(StatutTransaction.REMBOURSEE);
        transactionRepository.save(transaction);

        log.info("Commande {} annulee : {} XAF a rembourser au client, {} XAF retenus par la plateforme (sequestre vendeur {} debite de {} XAF)",
                commandeId, montantRembourseClient, fraisAnnulation, transaction.getVendeurId(), transaction.getMontantNet());
    }

    /**
     * Traite le remboursement lie a un litige "Produit non livre" resolu
     * par un admin : contrairement a l'annulation par le client (90/10),
     * il s'agit ici d'un remboursement integral (100%) au client, la
     * commande n'ayant jamais ete honoree du point de vue du vendeur.
     * Refuse si les fonds ont deja ete liberes vers le solde disponible
     * (potentiellement deja retires) : c'est a l'appelant (LitigeService)
     * de ne proposer cette action que lorsque fondsLiberes est encore faux.
     * Idempotent comme les deux methodes precedentes.
     */
    @Transactional
    public synchronized void traiterRemboursementLitige(Long commandeId) {
        Transaction transaction = transactionRepository
                .findByTypeReferenceAndReferenceId(TypeReference.COMMANDE, commandeId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "Aucune transaction de paiement trouvee pour la commande #" + commandeId));

        if (transaction.getStatut() != StatutTransaction.PAYE) {
            log.warn("Remboursement de litige demande pour la commande {} dont la transaction n'est pas PAYE (statut: {}). Ignoree.",
                    commandeId, transaction.getStatut());
            return;
        }

        if (transaction.isFondsLiberes()) {
            log.error("Remboursement de litige refuse pour la commande {} : fonds deja liberes vers le solde disponible (potentiellement deja retires).",
                    commandeId);
            throw new SoldeInsuffisantException("Impossible de rembourser automatiquement : les fonds de cette commande ont deja ete liberes vers le solde disponible du vendeur.");
        }

        SoldeVendeur solde = soldeVendeurRepository.findByVendeurId(transaction.getVendeurId())
                .orElseThrow(() -> new SoldeInsuffisantException(
                        "Portefeuille introuvable pour le vendeur " + transaction.getVendeurId()));

        solde.setSoldeSequestre(solde.getSoldeSequestre().subtract(transaction.getMontantNet()));
        soldeVendeurRepository.save(solde);

        transaction.setMontantRembourseClient(transaction.getMontant());
        transaction.setFraisAnnulation(BigDecimal.ZERO);
        transaction.setStatut(StatutTransaction.REMBOURSEE);
        transactionRepository.save(transaction);

        log.info("Litige resolu pour la commande {} : remboursement integral de {} XAF au client (sequestre vendeur {} debite de {} XAF)",
                commandeId, transaction.getMontant(), transaction.getVendeurId(), transaction.getMontantNet());
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
                            .soldeSequestre(BigDecimal.ZERO)
                            .soldeDisponible(BigDecimal.ZERO)
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

        // Seul le solde DISPONIBLE (fonds liberes apres livraison confirmee)
        // peut etre retire. Le solde sequestre reste verrouille meme si le
        // total des deux serait suffisant : ce sont des fonds qui ne
        // appartiennent pas encore definitivement au vendeur.
        if (soldeVendeur.getSoldeDisponible().compareTo(montant) < 0) {
            throw new SoldeInsuffisantException(String.format("Solde disponible insuffisant pour retirer %s XAF. Votre solde disponible est de %s XAF (le solde en sequestre n'est pas retirable tant que la commande n'est pas livree).",
                    montant, soldeVendeur.getSoldeDisponible()));
        }

        // Decrementer le solde disponible
        soldeVendeur.setSoldeDisponible(soldeVendeur.getSoldeDisponible().subtract(montant));
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
            // Utilise par commande-service (module Litige) pour determiner si
            // le remboursement en un clic est encore possible : une fois les
            // fonds liberes vers le solde disponible, ils sont potentiellement
            // deja retires et ne peuvent plus etre repris automatiquement.
            statutMap.put("fondsLiberes", transaction.isFondsLiberes());
        }

        return statutMap;
    }
}
