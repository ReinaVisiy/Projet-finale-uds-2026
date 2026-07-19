package com.agrycam.commande.controller;

import com.agrycam.commande.model.Commande;
import com.agrycam.commande.model.StatutCommande;
import com.agrycam.commande.payload.request.CommandeRequest;
import com.agrycam.commande.payload.response.CommandeResponse;
import com.agrycam.commande.payload.response.LigneCommandeResponse;
import com.agrycam.commande.service.CommandeService;
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
 * Contrôleur REST pour la gestion des commandes.
 * Expose les endpoints pour créer, consulter, mettre à jour et annuler des commandes.
 */
@RestController
@RequestMapping("/api/commandes")
public class CommandeController {

    @Autowired
    private CommandeService commandeService;

    // Les commandes contiennent des données privées (client, montants).
    // "authenticated" ne suffit pas : il faut vérifier QUI regarde.
    private boolean estAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    private boolean estProducteur(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_PRODUCTEUR"));
    }

    private boolean estProprietaire(Authentication authentication, Long clientId) {
        Object principal = authentication.getPrincipal();
        return principal instanceof Long && principal.equals(clientId);
    }

    // Stat publique pour la page d'accueil : un seul total, aucune commande
    // individuelle exposée (celles-ci restent réservées aux admins/producteurs/
    // propriétaires, cf. SecurityConfig).
    @GetMapping("/stats/publiques")
    public ResponseEntity<java.util.Map<String, Long>> getStatsPubliques() {
        return ResponseEntity.ok(java.util.Map.of("commandesLivrees", commandeService.compterCommandesLivrees()));
    }

    /**
     * Crée une nouvelle commande.
     * @param commandeRequest La requête de création de commande.
     * @return La commande créée avec un statut HTTP 201.
     */
    @PostMapping
    public ResponseEntity<CommandeResponse> createCommande(@Valid @RequestBody CommandeRequest commandeRequest) {
        Commande commande = commandeService.createCommande(commandeRequest);
        return new ResponseEntity<>(convertToDto(commande), HttpStatus.CREATED);
    }

    /**
     * Récupère toutes les commandes (réservé aux admins et producteurs :
     * un client ne doit pas pouvoir parcourir les commandes des autres).
     */
    @GetMapping
    public ResponseEntity<List<CommandeResponse>> getAllCommandes(Authentication authentication) {
        if (!estAdmin(authentication) && !estProducteur(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Commande> commandes = commandeService.getAllCommandes();
        return ResponseEntity.ok(commandes.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Récupère une commande par son ID (admin, producteur, ou le client
     * propriétaire de la commande uniquement).
     * @param id L'ID de la commande.
     * @return La commande trouvée avec un statut HTTP 200, ou un statut HTTP 404 si non trouvée.
     */
    @GetMapping("/{id}")
    public ResponseEntity<CommandeResponse> getCommandeById(@PathVariable Long id, Authentication authentication) {
        return commandeService.getCommandeById(id)
                .map(commande -> {
                    if (!estAdmin(authentication) && !estProducteur(authentication)
                            && !estProprietaire(authentication, commande.getClientId())) {
                        return new ResponseEntity<CommandeResponse>(HttpStatus.FORBIDDEN);
                    }
                    return ResponseEntity.ok(convertToDto(commande));
                })
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Récupère les commandes d'un client spécifique (le client lui-même,
     * un admin, ou un producteur — pas n'importe quel autre client).
     * @param clientId L'ID du client.
     * @return Une liste des commandes du client avec un statut HTTP 200.
     */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<CommandeResponse>> getCommandesByClientId(@PathVariable Long clientId, Authentication authentication) {
        if (!estAdmin(authentication) && !estProducteur(authentication) && !estProprietaire(authentication, clientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Commande> commandes = commandeService.getCommandesByClientId(clientId);
        return ResponseEntity.ok(commandes.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Met à jour le statut d'une commande.
     * @param id L'ID de la commande à mettre à jour.
     * @param statut Le nouveau statut de la commande.
     * @return La commande mise à jour avec un statut HTTP 200, ou un statut HTTP 404 si non trouvée.
     */
    @PutMapping("/{id}/statut")
    public ResponseEntity<CommandeResponse> updateStatutCommande(@PathVariable Long id, @RequestParam StatutCommande statut) {
        return commandeService.updateStatutCommande(id, statut)
                .map(commande -> ResponseEntity.ok(convertToDto(commande)))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Annule une commande par son ID.
     * @param id L'ID de la commande à annuler.
     * @return Un statut HTTP 204 si l'annulation est réussie, ou un statut HTTP 404 si non trouvée.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> annulerCommande(@PathVariable Long id) {
        if (commandeService.annulerCommande(id)) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    /**
     * Convertit une entité Commande en CommandeResponse DTO.
     * @param commande L'entité Commande.
     * @return Le CommandeResponse DTO correspondant.
     */
    private CommandeResponse convertToDto(Commande commande) {
        List<LigneCommandeResponse> ligneCommandeResponses = commande.getLignesCommande().stream()
                .map(lc -> new LigneCommandeResponse(lc.getId(), lc.getProduitId(), lc.getQuantite(), lc.getPrixUnitaire()))
                .collect(Collectors.toList());
        return new CommandeResponse(commande.getId(), commande.getClientId(), commande.getStatut(), commande.getDateCommande(), ligneCommandeResponses);
    }
}
