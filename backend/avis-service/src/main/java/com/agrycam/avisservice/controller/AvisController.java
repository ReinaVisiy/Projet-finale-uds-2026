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
@CrossOrigin(origins = "*")
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

    @GetMapping("/produit/{produitId}/stats")
    public ResponseEntity<AvisStatsResponse> getStats(@PathVariable Long produitId) {
        Double noteMoyenne = avisService.getNoteMoyenne(produitId);
        Long nombreAvis = avisService.getNombreAvis(produitId);
        return ResponseEntity.ok(new AvisStatsResponse(noteMoyenne, nombreAvis));
    }
}