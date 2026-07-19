package com.agrimarket.paiement_service.controller;

import com.agrimarket.paiement_service.entity.Paiement;
import com.agrimarket.paiement_service.enums.StatutPaiement;
import com.agrimarket.paiement_service.service.PaiementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementService paiementService;

    // Les paiements exposent des données privées (numéro mobile money,
    // montants) : "authenticated" ne suffit pas, il faut vérifier QUI regarde.
    private boolean estAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    private boolean estProprietaire(Authentication authentication, Long consommateurId) {
        Object principal = authentication.getPrincipal();
        return principal instanceof Long && principal.equals(consommateurId);
    }

    @PostMapping
    public ResponseEntity<Paiement> creerPaiement(@RequestBody Paiement paiement) {
        return ResponseEntity.ok(paiementService.creerPaiement(paiement));
    }

    // Admin, ou le consommateur propriétaire du paiement.
    @GetMapping("/{id}")
    public ResponseEntity<Paiement> getPaiementById(@PathVariable Long id, Authentication authentication) {
        Paiement paiement = paiementService.getPaiementById(id);
        if (!estAdmin(authentication) && !estProprietaire(authentication, paiement.getConsommateurId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(paiement);
    }

    // Réservé à l'admin : vérifier la propriété nécessiterait un appel
    // croisé vers commande-service (pas encore utilisé côté frontend).
    @GetMapping("/commande/{commandeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Paiement>> getPaiementsByCommande(@PathVariable Long commandeId) {
        return ResponseEntity.ok(paiementService.getPaiementsByCommande(commandeId));
    }

    // Admin, ou le consommateur consultant son propre historique.
    @GetMapping("/consommateur/{consommateurId}")
    public ResponseEntity<List<Paiement>> getPaiementsByConsommateur(@PathVariable Long consommateurId, Authentication authentication) {
        if (!estAdmin(authentication) && !estProprietaire(authentication, consommateurId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(paiementService.getPaiementsByConsommateur(consommateurId));
    }

    // Réservé à l'admin : seul un administrateur doit pouvoir confirmer
    // qu'un paiement a réellement été reçu (avant, n'importe quel
    // utilisateur authentifié pouvait marquer un paiement comme réussi).
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Paiement> mettreAJourStatut(@PathVariable Long id, @RequestParam StatutPaiement statut) {
        return ResponseEntity.ok(paiementService.mettreAJourStatut(id, statut));
    }

    // Réservé à l'admin : cette liste expose les paiements de tous les
    // utilisateurs (numéros de téléphone inclus).
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Paiement>> getAllPaiements() {
        return ResponseEntity.ok(paiementService.getAllPaiements());
    }
}