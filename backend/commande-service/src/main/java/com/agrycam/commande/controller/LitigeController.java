package com.agrycam.commande.controller;

import com.agrycam.commande.model.Litige;
import com.agrycam.commande.model.StatutLitige;
import com.agrycam.commande.payload.request.LitigeRequest;
import com.agrycam.commande.payload.response.LitigeResponse;
import com.agrycam.commande.service.LitigeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controleur REST pour les litiges (disputes) ouverts par les clients sur
 * leurs commandes. Cf. section 3 du cahier des charges (module Litige).
 */
@RestController
@RequestMapping("/api/litiges")
public class LitigeController {

    @Autowired
    private LitigeService litigeService;

    private boolean estAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    /**
     * POST /api/litiges (rôle client)
     * Ouvre un litige sur une commande dont le client authentifie est
     * proprietaire.
     */
    @PostMapping
    public ResponseEntity<LitigeResponse> creerLitige(@Valid @RequestBody LitigeRequest request, Authentication authentication) {
        Long clientId = (Long) authentication.getPrincipal();
        Litige litige = litigeService.creerLitige(request.getCommandeId(), clientId, request.getType(), request.getDescription());
        return new ResponseEntity<>(convertToDto(litige), HttpStatus.CREATED);
    }

    /**
     * GET /api/litiges (rôle admin)
     * Liste tous les litiges de la plateforme, avec le flag
     * fondsDejaRetires calcule pour chacun (pilote le bouton de
     * remboursement en un clic cote admin).
     */
    @GetMapping
    public ResponseEntity<List<LitigeResponse>> listerTousLesLitiges(Authentication authentication) {
        if (!estAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Litige> litiges = litigeService.listerTousLesLitiges();
        return ResponseEntity.ok(litiges.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * GET /api/litiges/mes-litiges (rôle client)
     * Liste les litiges ouverts par le client authentifie.
     */
    @GetMapping("/mes-litiges")
    public ResponseEntity<List<LitigeResponse>> listerMesLitiges(Authentication authentication) {
        Long clientId = (Long) authentication.getPrincipal();
        List<Litige> litiges = litigeService.listerLitigesClient(clientId);
        return ResponseEntity.ok(litiges.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * PUT /api/litiges/{id}/rembourser (rôle admin)
     * Resout un litige "Produit non livré" par remboursement integral en
     * un clic. Renvoie 400 si les fonds ont deja ete liberes (propage
     * depuis paiement-service) ou si le type de litige ne s'y prete pas.
     */
    @PutMapping("/{id}/rembourser")
    public ResponseEntity<LitigeResponse> rembourserLitige(@PathVariable Long id, Authentication authentication) {
        if (!estAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Litige litige = litigeService.rembourserLitige(id);
        return ResponseEntity.ok(convertToDto(litige));
    }

    /**
     * PUT /api/litiges/{id}/statut (rôle admin)
     * Resolution ou rejet manuel d'un litige (types autres que
     * PRODUIT_NON_LIVRE, ou rejet d'un litige non fonde), sans mouvement
     * financier automatique.
     */
    @PutMapping("/{id}/statut")
    public ResponseEntity<LitigeResponse> resoudreLitige(@PathVariable Long id, @RequestParam StatutLitige statut, Authentication authentication) {
        if (!estAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Litige litige = litigeService.resoudreLitigeManuellement(id, statut);
        return ResponseEntity.ok(convertToDto(litige));
    }

    private LitigeResponse convertToDto(Litige litige) {
        Boolean fondsDejaRetires = litigeService.calculerFondsDejaRetires(litige);
        return new LitigeResponse(
                litige.getId(), litige.getCommandeId(), litige.getClientId(), litige.getType(),
                litige.getDescription(), litige.getStatut(), litige.getDateCreation(),
                litige.getDateResolution(), fondsDejaRetires);
    }
}
