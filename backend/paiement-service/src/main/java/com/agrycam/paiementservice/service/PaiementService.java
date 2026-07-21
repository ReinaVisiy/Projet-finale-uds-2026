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
 * d'integration de la passerelle de paiement (NotchPay) et de retrait de fonds.
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

    @Value("${notchpay.api.url}")
    private String notchPayApiUrl;

    @Value("${notchpay.public-key}")
    private String notchPayPublicKey;

    @Value("${notchpay.secret-key}")
    private String notchPaySecretKey; // reserve pour la verification des webhooks (non utilise ici)

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${utilisateur.service.url}")
    private String utilisateurServiceUrl;

    /**
     * Initie un paiement cote client.
     * Calcule la commission fixe de 5%, le montant net vendeur,
     * et cree un paiement NotchPay.
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

        // 3. Recuperation des infos client (NotchPay exige un email) aupres
        // d'utilisateur-service, sans modifier le contrat d'API du frontend.
        UtilisateurInfoDTO client;
        try {
            client = restTemplate.getForObject(
                    utilisateurServiceUrl + "/api/utilisateurs/" + clientId,
                    UtilisateurInfoDTO.class
            );
        } catch (Exception e) {
            log.error("Impossible de recuperer les informations du client {} aupres d'utilisateur-service : {}",
                    clientId, e.getMessage());
            transaction.setStatut(StatutTransaction.ECHOUE);
            transactionRepository.save(transaction);
            throw new IllegalStateException(
                    "Impossible de recuperer les informations du client pour initier le paiement.", e);
        }
        if (client == null || client.getEmail() == null || client.getEmail().isBlank()) {
            log.error("Le client {} n'a pas d'email enregistre : NotchPay ne peut pas etre initie.", clientId);
            transaction.setStatut(StatutTransaction.ECHOUE);
            transactionRepository.save(transaction);
            throw new IllegalStateException("Le client ne dispose pas d'un email valide pour le paiement.");
        }

        // 4. Appel a la passerelle de paiement NotchPay (sandbox)
        String description = String.format("Paiement AgryCam - %s #%d", dto.getTypeReference(), dto.getReferenceId());

        // URL de retour unique (NotchPay ne distingue pas succes/echec par URL
        // separee) ; App.jsx traite deja /pay/success et /pay/cancel de
        // maniere identique, donc aucune modification frontend necessaire.
        String callbackUrl = String.format("%s/pay/success?transactionId=%d", frontendUrl, transaction.getId());

        NotchPayCustomer customer = NotchPayCustomer.builder()
                .name(client.getNom())
                .email(client.getEmail())
                .phone(client.getTelephone())
                .build();

        // NotchPay exige une reference UNIQUE POUR TOUJOURS sur tout le
        // compte (pas seulement pour la session en cours). Utiliser le seul
        // ID auto-incremente de la transaction locale n'est pas suffisant :
        // si la base paiement_db est un jour recreee (ex. ddl-auto=update
        // en dev), la sequence redemarre a 1 et on retombe sur une
        // reference deja envoyee a NotchPay -> 409 Conflict "Reference
        // already existing". On ajoute donc un suffixe aleatoire.
        String notchPayReference = "agrycam-" + transaction.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);

        NotchPayCreateRequest createRequest = NotchPayCreateRequest.builder()
                .amount(montantTotal)
                .currency("XAF")
                .customer(customer)
                .description(description)
                .callback(callbackUrl)
                .reference(notchPayReference)
                .build();

        try {
            HttpHeaders headers = new HttpHeaders();
            // NotchPay attend la cle publique brute dans Authorization, sans
            // prefixe "Bearer" (cf. documentation officielle).
            headers.set("Authorization", notchPayPublicKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<NotchPayCreateRequest> httpEntity = new HttpEntity<>(createRequest, headers);

            log.info("Appel de NotchPay API sur {}/payments pour initiation", notchPayApiUrl);
            ResponseEntity<NotchPayCreateResponse> responseEntity = restTemplate.postForEntity(
                    notchPayApiUrl + "/payments",
                    httpEntity,
                    NotchPayCreateResponse.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null
                    && responseEntity.getBody().getAuthorization_url() != null) {
                NotchPayCreateResponse notchResponse = responseEntity.getBody();
                // On stocke notre reference (unique) pour les verifications
                // ulterieures : c'est celle qu'on a envoyee a NotchPay.
                transaction.setSimizSessionId(notchPayReference);
                transaction.setSimizCheckoutUrl(notchResponse.getAuthorization_url());
                log.info("Paiement NotchPay cree avec succes pour la transaction {}", transaction.getId());
            } else {
                throw new IllegalStateException("Reponse invalide de NotchPay");
            }
        } catch (Exception e) {
            // Aucun mode de secours factice : une fausse URL menerait le
            // client vers une page inexistante (cf. bug deja rencontre avec
            // Simiz). En cas d'echec, la transaction est marquee ECHOUE et
            // une erreur claire remonte au frontend.
            log.error("Erreur lors de l'appel de l'API NotchPay : {}", e.getMessage());
            transaction.setStatut(StatutTransaction.ECHOUE);
            transactionRepository.save(transaction);
            throw new IllegalStateException(
                    "Impossible d'initier le paiement aupres de NotchPay. Reessayez plus tard.", e);
        }

        return transactionRepository.save(transaction);
    }

    /**
     * Verifie le statut d'un paiement en interrogeant directement l'API NotchPay (sondage/polling).
     * Si le statut est passe a PAYE, credite automatiquement le solde du vendeur (sequestre libere).
     * Methode synchronisee pour eviter les conditions de concurrence et les double-credits de solde.
     */
    @Transactional
    public synchronized Transaction verifierPaiement(Long id) {
        log.info("Verification de la transaction {} via NotchPay API (polling)...", id);
        
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
            log.error("Aucune reference NotchPay associee a la transaction {}", id);
            return transaction;
        }

        // Interroger l'API NotchPay
        String remoteStatus = "PENDING";
        try {
            HttpHeaders headers = new HttpHeaders();
            // Meme cle publique brute (sans "Bearer") que pour la creation.
            headers.set("Authorization", notchPayPublicKey);
            HttpEntity<Void> httpEntity = new HttpEntity<>(headers);

            // GET /payments/{reference} : "sessionId" contient en realite
            // notre propre reference NotchPay (cf. initierPaiement).
            String url = String.format("%s/payments/%s", notchPayApiUrl, sessionId);
            log.info("Appel de NotchPay API sur {}", url);
            ResponseEntity<NotchPayVerifyResponse> responseEntity = restTemplate.exchange(
                    url,
                    org.springframework.http.HttpMethod.GET,
                    httpEntity,
                    NotchPayVerifyResponse.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null
                    && responseEntity.getBody().getTransaction() != null) {
                remoteStatus = responseEntity.getBody().getTransaction().getStatus();
                log.info("Statut retourne par NotchPay pour la reference {}: {}", sessionId, remoteStatus);
            }
        } catch (Exception e) {
            log.error("Impossible de joindre l'API NotchPay pour verifier le paiement de la reference {}: {}. Statut inchange.",
                    sessionId, e.getMessage());
            // Dans le cadre du simulateur de developpement, si l'appel NotchPay echoue parce qu'il n'y a pas de vraie connexion internet,
            // on conserve le statut courant sans faire planter le service.
        }

        // Mettre a jour la transaction locale.
        // Valeurs observees cote NotchPay : pending, processing, complete,
        // failed, canceled, expired (cf. evenements webhook payment.complete
        // / payment.failed de la documentation officielle).
        if ("complete".equalsIgnoreCase(remoteStatus)) {
            confirmerPaiementInterne(transaction);
        } else if ("failed".equalsIgnoreCase(remoteStatus) || "canceled".equalsIgnoreCase(remoteStatus)) {
            transaction.setStatut(StatutTransaction.ECHOUE);
            transactionRepository.save(transaction);
            log.warn("Paiement NotchPay echoue pour la transaction {}", id);
            serviceCommunicationClient.notifierStatutPaiement(
                    transaction.getTypeReference(), transaction.getReferenceId(), false);
        } else if ("expired".equalsIgnoreCase(remoteStatus)) {
            transaction.setStatut(StatutTransaction.EXPIRE);
            transactionRepository.save(transaction);
            log.info("Session de paiement NotchPay expiree pour la transaction {}", id);
            serviceCommunicationClient.notifierStatutPaiement(
                    transaction.getTypeReference(), transaction.getReferenceId(), false);
        }
        // pending / processing : aucun changement, le sondage cote frontend continuera.

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
        // transaction reellement confirmee cote NotchPay.
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
     * Traite le webhook passif envoye par NotchPay (nom de methode conserve
     * pour eviter de toucher le mapping du controleur ; a renommer plus tard
     * si souhaite).
     * Valide le paiement de maniere securisee en interrogeant l'API NotchPay pour eviter tout spoofing de requete.
     */
    @Transactional
    public void traiterWebhookSimiz(Map<String, Object> payload) {
        log.info("Reception d'un Webhook de NotchPay: {}", payload);
        
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
            log.warn("Aucune transaction correspondante trouvee pour la reference NotchPay: {}", sessionId);
            return;
        }

        // Pour une securite maximale, au lieu de faire aveuglément confiance au payload du webhook,
        // on declenche notre methode verifierPaiement qui interroge directement l'API NotchPay via un canal securise de confiance.
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
