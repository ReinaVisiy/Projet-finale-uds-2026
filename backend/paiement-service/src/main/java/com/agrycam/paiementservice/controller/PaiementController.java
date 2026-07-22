package com.agrycam.paiementservice.controller;

import com.agrycam.paiementservice.dto.InitiationPaiementDTO;
import com.agrycam.paiementservice.dto.RetraitDTO;
import com.agrycam.paiementservice.entity.Retrait;
import com.agrycam.paiementservice.entity.SoldeVendeur;
import com.agrycam.paiementservice.entity.Transaction;
import com.agrycam.paiementservice.entity.TypeReference;
import com.agrycam.paiementservice.service.PaiementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Controleur REST exposant les endpoints de paiement, de portefeuille, de webhook et d'administration.
 * Tous les endpoints sont proteges par JWT, a l'exception du webhook de paiement (NotchPay).
 */
@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
@Slf4j
public class PaiementController {

    private final PaiementService paiementService;

    /**
     * Helper pour recuperer l'ID de l'utilisateur connecte a partir du contexte de securite.
     */
    private Long getConnecteUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }
        throw new IllegalStateException("Impossible de recuperer l'identifiant de l'utilisateur connecte.");
    }

    /**
     * POST /api/paiements/initier (rôle client)
     * Cree une Transaction EN_ATTENTE et initie un paiement avec NotchPay.
     * Renvoie l'URL de checkout a rediriger cote client.
     */
    @PostMapping("/initier")
    @PreAuthorize("hasAnyRole('CLIENT', 'USER')")
    public ResponseEntity<Transaction> initierPaiement(@RequestBody InitiationPaiementDTO dto) {
        Long clientId = getConnecteUserId();
        Transaction transaction = paiementService.initierPaiement(dto, clientId);
        return ResponseEntity.ok(transaction);
    }

    /**
     * GET /api/paiements/{id}/verifier
     * Sonde l'API NotchPay pour mettre a jour le statut du paiement en base de donnees.
     * Si la transaction passe a PAYE, le solde du vendeur (95%) est credite.
     */
    @GetMapping("/{id}/verifier")
    public ResponseEntity<Transaction> verifierPaiement(@PathVariable Long id) {
        Transaction transaction = paiementService.verifierPaiement(id);
        return ResponseEntity.ok(transaction);
    }

    /**
     * GET /api/paiements/statut/{typeReference}/{referenceId}
     * Permet aux autres microservices d'AgryCam (commande-service, certification-service)
     * de verifier rapidement si un element donne a ete paye.
     */
    @GetMapping("/statut/{typeReference}/{referenceId}")
    public ResponseEntity<Map<String, Object>> verifierStatutReference(
            @PathVariable TypeReference typeReference,
            @PathVariable Long referenceId) {
        Map<String, Object> statut = paiementService.recupererStatutReference(typeReference, referenceId);
        return ResponseEntity.ok(statut);
    }

    /**
     * PUT /api/paiements/commandes/{commandeId}/liberer (rôle admin / service interne)
     * Appele par commande-service lorsqu'une commande passe a LIVREE :
     * transfere le montant net de la transaction du solde sequestre vers
     * le solde disponible (retirable) du vendeur. Idempotent.
     */
    @PutMapping("/commandes/{commandeId}/liberer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> libererFondsSequestre(@PathVariable Long commandeId) {
        paiementService.libererFondsSequestre(commandeId);
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/paiements/commandes/{commandeId}/rembourser-annulation (rôle admin / service interne)
     * Appele par commande-service lorsqu'une commande est annulee avant
     * expedition : traite le remboursement 90% client / 10% frais plateforme
     * et debite le sequestre du vendeur. Idempotent.
     */
    @PutMapping("/commandes/{commandeId}/rembourser-annulation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rembourserAnnulation(@PathVariable Long commandeId) {
        paiementService.traiterRemboursementAnnulation(commandeId);
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/paiements/commandes/{commandeId}/rembourser-litige (rôle admin / service interne)
     * Appele par commande-service (module Litige) lorsqu'un admin resout
     * un litige "Produit non livré" par un remboursement en un clic :
     * rembourse 100% au client et debite le sequestre du vendeur. Refuse
     * (400, via SoldeInsuffisantException) si les fonds ont deja ete
     * liberes vers le solde disponible.
     */
    @PutMapping("/commandes/{commandeId}/rembourser-litige")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rembourserLitige(@PathVariable Long commandeId) {
        paiementService.traiterRemboursementLitige(commandeId);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/paiements/webhook/notchpay (Public / Non protege par JWT)
     * Receptionne les notifications asynchrones de paiement de NotchPay.
     */
    @PostMapping("/webhook/notchpay")
    public ResponseEntity<Void> recevoirWebhookNotchpay(@RequestBody Map<String, Object> payload) {
        paiementService.traiterWebhookNotchpay(payload);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/paiements/mon-solde (rôle vendeur)
     * Renvoie le solde actuel disponible dans le portefeuille du vendeur connecte.
     */
    @GetMapping("/mon-solde")
    @PreAuthorize("hasRole('PRODUCTEUR')")
    public ResponseEntity<SoldeVendeur> recupererMonSolde() {
        Long vendeurId = getConnecteUserId();
        SoldeVendeur solde = paiementService.recupererSoldeVendeur(vendeurId);
        return ResponseEntity.ok(solde);
    }

    /**
     * GET /api/paiements/mes-transactions (rôle vendeur)
     * Renvoie l'historique des transactions/ventes afferentes au vendeur connecte.
     */
    @GetMapping("/mes-transactions")
    @PreAuthorize("hasRole('PRODUCTEUR')")
    public ResponseEntity<List<Transaction>> recupererMesTransactions() {
        Long vendeurId = getConnecteUserId();
        List<Transaction> transactions = paiementService.recupererTransactionsVendeur(vendeurId);
        return ResponseEntity.ok(transactions);
    }

    /**
     * POST /api/paiements/retrait (rôle vendeur)
     * Effectue un retrait de fonds simule depuis le solde disponible du vendeur.
     * Decremente le solde et genere un recu de retrait contenant une reference de virement factice.
     */
    @PostMapping("/retrait")
    @PreAuthorize("hasRole('PRODUCTEUR')")
    public ResponseEntity<RetraitDTO> demanderRetrait(@RequestBody Map<String, BigDecimal> request) {
        Long vendeurId = getConnecteUserId();
        BigDecimal montant = request.get("montant");
        if (montant == null) {
            throw new IllegalArgumentException("Le champ 'montant' est obligatoire.");
        }
        
        Retrait retrait = paiementService.demanderRetrait(vendeurId, montant);
        
        // Mapping vers le DTO de retour
        RetraitDTO dto = RetraitDTO.builder()
                .id(retrait.getId())
                .vendeurId(retrait.getVendeurId())
                .montant(retrait.getMontant())
                .referencePaiement(retrait.getReferencePaiement())
                .statut(retrait.getStatut())
                .dateDemande(retrait.getDateDemande())
                .build();
                
        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/paiements/mes-retraits (rôle vendeur)
     * Renvoie l'historique des retraits effectues par le vendeur connecte.
     */
    @GetMapping("/mes-retraits")
    @PreAuthorize("hasRole('PRODUCTEUR')")
    public ResponseEntity<List<Retrait>> recupererMesRetraits() {
        Long vendeurId = getConnecteUserId();
        List<Retrait> retraits = paiementService.recupererRetraitsVendeur(vendeurId);
        return ResponseEntity.ok(retraits);
    }

    /**
     * GET /api/paiements/admin/toutes-transactions (rôle admin)
     * Permet a l'administrateur de lister l'ensemble des transactions de paiement de la marketplace.
     */
    @GetMapping("/admin/toutes-transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Transaction>> recupererToutesTransactionsAdmin() {
        List<Transaction> transactions = paiementService.recupererToutesTransactions();
        return ResponseEntity.ok(transactions);
    }

    /**
     * GET /api/paiements/admin/solde-plateforme (rôle admin)
     * Renvoie l'etat courant du portefeuille de la plateforme : le cumul
     * historique total gagne (commissions + frais d'annulation, ne diminue
     * jamais) et le solde reellement disponible pour un retrait.
     */
    @GetMapping("/admin/solde-plateforme")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.agrycam.paiementservice.entity.SoldePlateforme> recupererSoldePlateforme() {
        return ResponseEntity.ok(paiementService.recupererSoldePlateforme());
    }

    /**
     * POST /api/paiements/admin/retrait (rôle admin)
     * Effectue un retrait de fonds simule depuis le solde disponible de la
     * plateforme. Comme aucune coordonnee de paiement n'existait au
     * prealable dans le systeme, la methode (MOMO / ORANGE_MONEY) et le
     * numero beneficiaire sont demandes ici, uniquement a des fins de
     * simulation d'un virement (un identifiant de transaction factice est
     * genere, sur le meme principe que le retrait vendeur).
     */
    @PostMapping("/admin/retrait")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.agrycam.paiementservice.dto.RetraitPlateformeDTO> demanderRetraitPlateforme(
            @RequestBody com.agrycam.paiementservice.dto.DemandeRetraitPlateformeDTO dto) {
        Long adminId = getConnecteUserId();

        com.agrycam.paiementservice.entity.RetraitPlateforme retrait =
                paiementService.demanderRetraitPlateforme(adminId, dto.getMontant(), dto.getMethode(), dto.getNumero());

        com.agrycam.paiementservice.dto.RetraitPlateformeDTO reponse =
                com.agrycam.paiementservice.dto.RetraitPlateformeDTO.builder()
                        .id(retrait.getId())
                        .montant(retrait.getMontant())
                        .methode(retrait.getMethode())
                        .numero(retrait.getNumero())
                        .referencePaiement(retrait.getReferencePaiement())
                        .statut(retrait.getStatut())
                        .dateDemande(retrait.getDateDemande())
                        .build();

        return ResponseEntity.ok(reponse);
    }

    /**
     * GET /api/paiements/admin/retraits (rôle admin)
     * Renvoie l'historique des retraits effectues sur le portefeuille de
     * la plateforme, du plus recent au plus ancien.
     */
    @GetMapping("/admin/retraits")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<com.agrycam.paiementservice.entity.RetraitPlateforme>> recupererRetraitsPlateforme() {
        return ResponseEntity.ok(paiementService.recupererRetraitsPlateforme());
    }
}
