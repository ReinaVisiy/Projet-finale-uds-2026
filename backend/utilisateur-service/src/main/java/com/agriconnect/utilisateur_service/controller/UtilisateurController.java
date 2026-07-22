package com.agriconnect.utilisateur_service.controller;

import com.agriconnect.utilisateur_service.dto.AjouterAdminRequest;
import com.agriconnect.utilisateur_service.dto.ChangerMotDePasseRequest;
import com.agriconnect.utilisateur_service.dto.CredentialsResponse;
import com.agriconnect.utilisateur_service.dto.SuspensionRequest;
import com.agriconnect.utilisateur_service.dto.UpdateProfilRequest;
import com.agriconnect.utilisateur_service.dto.UtilisateurDTO;
import com.agriconnect.utilisateur_service.entity.Utilisateur;
import com.agriconnect.utilisateur_service.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @Value("${internal.service.secret}")
    private String internalServiceSecret;

    @GetMapping
    public ResponseEntity<List<UtilisateurDTO>> getAllUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.getAllUtilisateurs());
    }

    @GetMapping("/stats/publiques")
    public ResponseEntity<java.util.Map<String, Long>> getStatsPubliques() {
        return ResponseEntity.ok(utilisateurService.getStatsPubliques());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurDTO> getUtilisateurById(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.getUtilisateurById(id));
    }

    // Ce endpoint expose le hash du mot de passe : bien qu'il tombe sous le
    // permitAll de GET /api/utilisateurs/** (necessaire car appele par
    // auth-service AVANT qu'un JWT existe), il exige en plus un secret
    // partage connu uniquement des services backend. Sans ce secret,
    // n'importe qui pouvait auparavant recuperer le hash de n'importe quel
    // compte par email.
    @GetMapping("/credentials")
    public ResponseEntity<CredentialsResponse> getCredentials(
            @RequestParam String email,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret) {
        if (secret == null || !secret.equals(internalServiceSecret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(utilisateurService.getCredentialsByEmail(email));
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<UtilisateurDTO>> rechercherParNom(@RequestParam String nom) {
        return ResponseEntity.ok(utilisateurService.rechercherUtilisateursParNom(nom));
    }

    // Reserve aux admins : sans cette garde, n'importe quel compte
    // authentifie (client, vendeur...) pouvait s'auto-promouvoir admin en
    // appelant directement cet endpoint.
    @PostMapping("/admin/creer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UtilisateurDTO> creerAdministrateur(@RequestBody AjouterAdminRequest request) {
        return ResponseEntity.ok(utilisateurService.creerAdministrateur(
                request.getNom(), request.getEmail(), request.getPassword()));
    }

    @PostMapping
    public ResponseEntity<UtilisateurDTO> createUtilisateur(@RequestBody Utilisateur utilisateur) {
        return ResponseEntity.ok(utilisateurService.createUtilisateur(utilisateur));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UtilisateurDTO> updateProfil(
            @PathVariable Long id,
            @RequestBody UpdateProfilRequest request) {
        return ResponseEntity.ok(utilisateurService.updateProfil(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUtilisateur(@PathVariable Long id) {
        utilisateurService.deleteUtilisateur(id);
        return ResponseEntity.ok("Utilisateur supprime avec succes");
    }

    @PutMapping("/{id}/mot-de-passe")
    public ResponseEntity<String> changerMotDePasse(
            @PathVariable Long id,
            @RequestBody ChangerMotDePasseRequest request) {
        utilisateurService.changerMotDePasse(id, request);
        return ResponseEntity.ok("Mot de passe modifie avec succes");
    }

    // Suspendre/lever la suspension d'un compte (admin uniquement). Un
    // compte suspendu ne peut plus se connecter tant que la date n'est
    // pas dépassée (vérifié côté auth-service). Pas de blocage définitif
    // séparé : un grand nombre de jours suffit pour un blocage quasi permanent.
    @PutMapping("/{id}/suspension")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UtilisateurDTO> suspendreUtilisateur(
            @PathVariable Long id,
            @RequestBody SuspensionRequest request) {
        UtilisateurDTO response = utilisateurService.suspendreUtilisateur(id, request.getJours());
        return ResponseEntity.ok(response);
    }

    // Ancien mot de passe incorrect -> 400, distinct du 404 "non trouve".
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}