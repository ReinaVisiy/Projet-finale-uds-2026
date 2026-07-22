package com.agrycam.produitservice.controller;

import com.agrycam.produitservice.dto.ProduitRequest;
import com.agrycam.produitservice.dto.ProduitResponse;
import com.agrycam.produitservice.service.ProduitService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/produits")
@RequiredArgsConstructor
public class ProduitController {

    private final ProduitService produitService;

    @GetMapping
    public ResponseEntity<List<ProduitResponse>> getAffichageParDefaut() {
        return ResponseEntity.ok(produitService.getAffichageParDefaut());
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<ProduitResponse>> rechercher(
            @RequestParam(required = false) String motCle,
            @RequestParam(required = false) String localisation,
            @RequestParam(required = false) Long categorieId,
            @RequestParam(required = false) BigDecimal prixMin,
            @RequestParam(required = false) BigDecimal prixMax,
            @RequestParam(required = false) Integer stockMin,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateLimite,
            @RequestParam(required = false) Double noteMin,
            @RequestParam(required = false) String tri) {
        
        List<ProduitResponse> resultats = produitService.rechercher(
                motCle, localisation, categorieId, prixMin, prixMax, stockMin, dateLimite, noteMin, tri
        );
        return ResponseEntity.ok(resultats);
    }

    @GetMapping("/mes-produits")
    public ResponseEntity<List<ProduitResponse>> getMesProduits(Authentication authentication) {
        Long producteurId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(produitService.getMesProduits(producteurId));
    }

    /** Consultation publique des produits d'un producteur (page profil producteur). */
    @GetMapping("/producteur/{producteurId}")
    public ResponseEntity<List<ProduitResponse>> getParProducteur(@PathVariable Long producteurId) {
        return ResponseEntity.ok(produitService.getProduitsParProducteur(producteurId));
    }

    @PostMapping("/publier")
    public ResponseEntity<ProduitResponse> publier(
            @RequestBody ProduitRequest request,
            Authentication authentication) {
        Long producteurId = (Long) authentication.getPrincipal();
        ProduitResponse response = produitService.publier(request, producteurId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProduitResponse> getParId(@PathVariable Long id) {
        return ResponseEntity.ok(produitService.getParId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProduitResponse> modifier(
            @PathVariable Long id,
            @RequestBody ProduitRequest request,
            Authentication authentication) {
        Long producteurId = (Long) authentication.getPrincipal();
        ProduitResponse response = produitService.modifier(id, request, producteurId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            Authentication authentication) {
        Long producteurId = (Long) authentication.getPrincipal();
        produitService.supprimer(id, producteurId);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/produits/{id}/admin (rôle admin) — suppression d'un
     * produit signalé depuis le panneau de modération, sans vérification
     * de propriété.
     */
    @DeleteMapping("/{id}/admin")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> supprimerParAdmin(@PathVariable Long id) {
        produitService.supprimerParAdmin(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/produits/{id}/decrementer-stock (rôle admin / service interne)
     * Appelé par commande-service lorsqu'une commande est payée, pour
     * répercuter la vente sur le stock réel du produit.
     */
    @PutMapping("/{id}/decrementer-stock")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> decrementerStock(
            @PathVariable Long id,
            @RequestParam int quantite) {
        produitService.decrementerStock(id, quantite);
        return ResponseEntity.ok().build();
    }
}
