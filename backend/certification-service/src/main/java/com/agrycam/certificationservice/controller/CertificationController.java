package com.agrycam.certificationservice.controller;

import com.agrycam.certificationservice.dto.CertificationRequest;
import com.agrycam.certificationservice.dto.CertificationResponse;
import com.agrycam.certificationservice.dto.CertificationReviewRequest;
import com.agrycam.certificationservice.dto.PaymentConfirmationRequest;
import com.agrycam.certificationservice.dto.PaymentInformationResponse;
import com.agrycam.certificationservice.entity.MoyenPaiement;
import com.agrycam.certificationservice.service.CertificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certifications")
@CrossOrigin(origins = "*")
public class CertificationController {

    private final CertificationService certificationService;

    public CertificationController(CertificationService certificationService) {
        this.certificationService = certificationService;
    }

    @PostMapping("/soumettre")
    public ResponseEntity<CertificationResponse> soumettre(
            @RequestBody CertificationRequest request,
            Authentication authentication) {
        Long producteurId = (Long) authentication.getPrincipal();
        CertificationResponse response = certificationService.soumettre(request, producteurId);
        return ResponseEntity.ok(response);
    }

    // Stat publique pour la page d'accueil ("Producteurs vérifiés") — un seul
    // nombre, aucune donnée privée sur les producteurs ou leurs documents.
    @GetMapping("/stats/publiques")
    public ResponseEntity<java.util.Map<String, Long>> getStatsPubliques() {
        return ResponseEntity.ok(java.util.Map.of("producteursVerifies", certificationService.compterProducteursVerifies()));
    }

    @GetMapping("/mes-certifications")
    public ResponseEntity<List<CertificationResponse>> getMesCertifications(
            Authentication authentication) {
        Long producteurId = (Long) authentication.getPrincipal();
        List<CertificationResponse> responses = certificationService.getMesCertifications(producteurId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CertificationResponse> getParId(@PathVariable Long id) {
        CertificationResponse response = certificationService.getParId(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statut-actif/{producteurId}")
    public ResponseEntity<Boolean> estCertifieActif(@PathVariable Long producteurId) {
        boolean active = certificationService.estCertifieActif(producteurId);
        return ResponseEntity.ok(active);
    }

    @GetMapping("/payment-information")
    public ResponseEntity<List<PaymentInformationResponse>> getPaymentInformation() {
        return ResponseEntity.ok(List.of(
                new PaymentInformationResponse(MoyenPaiement.MTN_MOMO, "673751742"),
                new PaymentInformationResponse(MoyenPaiement.ORANGE_MONEY, "688882492")
        ));
    }

    @GetMapping("/admin/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CertificationResponse>> getEnAttente() {
        List<CertificationResponse> responses = certificationService.getEnAttente();
        return ResponseEntity.ok(responses);
    }

    // Toutes les certifications (en attente + approuvées + rejetées),
    // utilisé par le tableau de bord admin pour que les certifications
    // ne disparaissent pas une fois traitées.
    @GetMapping("/admin/toutes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CertificationResponse>> getToutes() {
        List<CertificationResponse> responses = certificationService.getToutes();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/admin/{id}/paiement")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CertificationResponse> confirmerPaiement(
            @PathVariable Long id,
            @RequestBody PaymentConfirmationRequest request,
            Authentication authentication) {
        CertificationResponse response = certificationService.confirmerPaiement(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/admin/{id}/reviser")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CertificationResponse> reviser(
            @PathVariable Long id,
            @RequestBody CertificationReviewRequest reviewRequest,
            Authentication authentication) {
        Long adminId = (Long) authentication.getPrincipal();
        CertificationResponse response = certificationService.reviser(id, reviewRequest, adminId);
        return ResponseEntity.ok(response);
    }
}
