package com.agrycam.signalement.controller;

import com.agrycam.signalement.model.Signalement;
import com.agrycam.signalement.model.StatutSignalement;
import com.agrycam.signalement.model.TypeSignalement;
import com.agrycam.signalement.payload.request.SignalementRequest;
import com.agrycam.signalement.payload.response.SignalementResponse;
import com.agrycam.signalement.service.SignalementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur REST pour la gestion des signalements.
 * Expose les endpoints pour créer, consulter, mettre à jour et supprimer des signalements.
 */
@RestController
@RequestMapping("/api/signalements")
public class SignalementController {

    @Autowired
    private SignalementService signalementService;

    /**
     * Crée un nouveau signalement.
     * @param signalementRequest La requête de création de signalement.
     * @return Le signalement créé avec un statut HTTP 201.
     */
    @PostMapping
    public ResponseEntity<SignalementResponse> createSignalement(@Valid @RequestBody SignalementRequest signalementRequest) {
        Signalement signalement = signalementService.createSignalement(signalementRequest);
        return new ResponseEntity<>(convertToDto(signalement), HttpStatus.CREATED);
    }

    /**
     * Récupère tous les signalements.
     * @return Une liste de tous les signalements avec un statut HTTP 200.
     */
    @GetMapping
    public ResponseEntity<List<SignalementResponse>> getAllSignalements() {
        List<Signalement> signalements = signalementService.getAllSignalements();
        return ResponseEntity.ok(signalements.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Récupère un signalement par son ID.
     * @param id L'ID du signalement.
     * @return Le signalement trouvé avec un statut HTTP 200, ou un statut HTTP 404 si non trouvé.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SignalementResponse> getSignalementById(@PathVariable Long id) {
        return signalementService.getSignalementById(id)
                .map(signalement -> ResponseEntity.ok(convertToDto(signalement)))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Récupère les signalements faits par un utilisateur spécifique.
     * @param reporterId L'ID de l'utilisateur qui a fait le signalement.
     * @return Une liste des signalements faits par l'utilisateur avec un statut HTTP 200.
     */
    @GetMapping("/reporter/{reporterId}")
    public ResponseEntity<List<SignalementResponse>> getSignalementsByReporterId(@PathVariable Long reporterId) {
        List<Signalement> signalements = signalementService.getSignalementsByReporterId(reporterId);
        return ResponseEntity.ok(signalements.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Récupère les signalements d'une cible spécifique (produit ou utilisateur).
     * @param targetId L'ID de la cible.
     * @param type Le type de la cible (PRODUIT ou UTILISATEUR).
     * @return Une liste des signalements concernant la cible avec un statut HTTP 200.
     */
    @GetMapping("/target/{type}/{targetId}")
    public ResponseEntity<List<SignalementResponse>> getSignalementsByTargetIdAndType(@PathVariable TypeSignalement type, @PathVariable Long targetId) {
        List<Signalement> signalements = signalementService.getSignalementsByTargetIdAndType(targetId, type);
        return ResponseEntity.ok(signalements.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Récupère les signalements par leur statut.
     * @param statut Le statut du signalement.
     * @return Une liste des signalements ayant le statut spécifié avec un statut HTTP 200.
     */
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<SignalementResponse>> getSignalementsByStatut(@PathVariable StatutSignalement statut) {
        List<Signalement> signalements = signalementService.getSignalementsByStatut(statut);
        return ResponseEntity.ok(signalements.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Met à jour le statut d'un signalement.
     * Réservé aux administrateurs. L'ID de l'administrateur est tiré du token JWT,
     * jamais du corps de la requête, pour éviter qu'un utilisateur ne se fasse
     * passer pour un administrateur.
     * @param id L'ID du signalement à mettre à jour.
     * @param statut Le nouveau statut du signalement.
     * @param authentication L'authentification de l'administrateur connecté.
     * @return Le signalement mis à jour avec un statut HTTP 200, ou un statut HTTP 404 si non trouvé.
     */
    @PutMapping("/{id}/statut")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SignalementResponse> updateStatutSignalement(
            @PathVariable Long id,
            @RequestParam StatutSignalement statut,
            Authentication authentication) {
        Long administrateurId = (Long) authentication.getPrincipal();
        return signalementService.updateStatutSignalement(id, statut, administrateurId)
                .map(signalement -> ResponseEntity.ok(convertToDto(signalement)))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Supprime un signalement par son ID.
     * @param id L'ID du signalement à supprimer.
     * @return Un statut HTTP 204 si la suppression est réussie, ou un statut HTTP 404 si non trouvée.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSignalement(@PathVariable Long id) {
        if (signalementService.getSignalementById(id).isPresent()) {
            signalementService.deleteSignalement(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    /**
     * Convertit une entité Signalement en SignalementResponse DTO.
     * @param signalement L'entité Signalement.
     * @return Le SignalementResponse DTO correspondant.
     */
    private SignalementResponse convertToDto(Signalement signalement) {
        return new SignalementResponse(
                signalement.getId(),
                signalement.getType(),
                signalement.getTargetId(),
                signalement.getReporterId(),
                signalement.getRaison(),
                signalement.getStatut(),
                signalement.getDateCreation(),
                signalement.getDateResolution(),
                signalement.getAdministrateurId()
        );
    }
}
