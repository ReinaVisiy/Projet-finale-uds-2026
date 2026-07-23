package com.agrycam.avisservice.controller;

import com.agrycam.avisservice.dto.AvisRequest;
import com.agrycam.avisservice.dto.AvisResponse;
import com.agrycam.avisservice.dto.AvisStatsResponse;
import com.agrycam.avisservice.service.AvisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/avis")
@RequiredArgsConstructor
public class AvisController {

    private final AvisService avisService;

    @PostMapping("/publier")
    public ResponseEntity<AvisResponse> publier(
            @RequestBody AvisRequest request,
            Authentication authentication) {
        Long clientId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                avisService.publier(request, clientId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AvisResponse> modifier(
            @PathVariable Long id,
            @RequestBody AvisRequest request,
            Authentication authentication) {
        Long clientId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(
                avisService.modifier(id, request, clientId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            Authentication authentication) {
        Long clientId = (Long) authentication.getPrincipal();
        avisService.supprimer(id, clientId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/produit/{produitId}")
    public ResponseEntity<List<AvisResponse>> getParProduit(@PathVariable Long produitId) {
        return ResponseEntity.ok(avisService.getParProduit(produitId));
    }

    // Public : consulté depuis le profil public d'un utilisateur (client
    // ou producteur en mode client) pour lister les avis qu'il a laissés.
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<AvisResponse>> getParClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(avisService.getParClient(clientId));
    }

    @GetMapping("/produit/{produitId}/stats")
    public ResponseEntity<AvisStatsResponse> getStats(@PathVariable Long produitId) {
        Double noteMoyenne = avisService.getNoteMoyenne(produitId);
        Long nombreAvis = avisService.getNombreAvis(produitId);
        return ResponseEntity.ok(new AvisStatsResponse(noteMoyenne, nombreAvis));
    }

    // ---- Avis "plateforme" (satisfaction générale, proposé à la déconnexion) ----

    @PostMapping("/plateforme/publier")
    public ResponseEntity<AvisResponse> publierAvisPlateforme(
            @RequestBody AvisRequest request,
            Authentication authentication) {
        Long clientId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(avisService.publierAvisPlateforme(request, clientId));
    }

    // Public : liste complète des avis plateforme, meilleure note d'abord.
    // Utilisé pour le top 3 de la page d'accueil et le "voir plus".
    @GetMapping("/plateforme")
    public ResponseEntity<List<AvisResponse>> getAvisPlateforme() {
        return ResponseEntity.ok(avisService.getAvisPlateforme());
    }

    @GetMapping("/plateforme/stats")
    public ResponseEntity<AvisStatsResponse> getStatsPlateforme() {
        Double noteMoyenne = avisService.getNoteMoyennePlateforme();
        Long nombreAvis = avisService.getNombreAvisPlateforme();
        return ResponseEntity.ok(new AvisStatsResponse(noteMoyenne, nombreAvis));
    }

    // Indique si l'utilisateur connecté a déjà évalué la plateforme (sert à
    // décider, côté frontend, si le pop-up doit s'afficher à la déconnexion).
    // Non authentifié -> false (le frontend ne l'appelle de toute façon que
    // pour un utilisateur connecté).
    @GetMapping("/plateforme/a-deja-evalue")
    public ResponseEntity<Boolean> aDejaEvaluePlateforme(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(false);
        }
        Long clientId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(avisService.aDejaEvaluePlateforme(clientId));
    }
}