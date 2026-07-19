package com.agrycam.commande.service;

import com.agrycam.commande.dto.ProduitInfoDTO;
import com.agrycam.commande.dto.UtilisateurInfoDTO;
import com.agrycam.commande.model.Commande;
import com.agrycam.commande.model.LigneCommande;
import com.agrycam.commande.model.StatutCommande;
import com.agrycam.commande.payload.request.CommandeRequest;
import com.agrycam.commande.payload.request.LigneCommandeRequest;
import com.agrycam.commande.repository.CommandeRepository;
import com.agrycam.commande.repository.LigneCommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des opérations liées aux commandes.
 * Contient la logique métier pour créer, consulter, mettre à jour et annuler des commandes.
 */
@Service
public class CommandeService {

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private LigneCommandeRepository ligneCommandeRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${produit.service.url}")
    private String produitServiceUrl;

    @Value("${utilisateur.service.url}")
    private String utilisateurServiceUrl;

    /**
     * Crée une nouvelle commande à partir d'une requête de commande.
     * Valide l'existence du client et de chaque produit auprès des services
     * correspondants, et utilise le prix réel du produit plutôt que celui
     * fourni par le client (pour éviter toute manipulation du prix).
     * @param commandeRequest La requête contenant les détails de la commande.
     * @return La commande créée.
     */
    @Transactional
    public Commande createCommande(CommandeRequest commandeRequest) {
        // Vérifie que le client existe réellement dans utilisateur-service
        verifierClientExiste(commandeRequest.getClientId());

        Commande commande = new Commande(commandeRequest.getClientId());

        List<LigneCommande> lignesCommande = commandeRequest.getLignesCommande().stream()
                .map(lcReq -> creerLigneCommande(commande, lcReq))
                .collect(Collectors.toList());

        commande.setLignesCommande(lignesCommande);
        return commandeRepository.save(commande);
    }

    /**
     * Vérifie qu'un utilisateur existe dans utilisateur-service.
     * @param clientId L'ID du client à vérifier.
     * @throws RuntimeException si le client n'existe pas ou si utilisateur-service est injoignable.
     */
    private void verifierClientExiste(Long clientId) {
        try {
            UtilisateurInfoDTO utilisateur = restTemplate.getForObject(
                    utilisateurServiceUrl + "/api/utilisateurs/" + clientId,
                    UtilisateurInfoDTO.class);
            if (utilisateur == null || utilisateur.getId() == null) {
                throw new RuntimeException("Client introuvable (ID: " + clientId + ")");
            }
        } catch (RuntimeException e) {
            throw new RuntimeException("Client introuvable ou service utilisateur indisponible (ID: " + clientId + ")");
        }
    }

    /**
     * Construit une ligne de commande en validant le produit auprès de produit-service
     * et en utilisant le prix et le stock réels du produit.
     * @param commande La commande parente.
     * @param lcReq La ligne de commande demandée.
     * @return La ligne de commande construite avec le prix authentique.
     */
    private LigneCommande creerLigneCommande(Commande commande, LigneCommandeRequest lcReq) {
        ProduitInfoDTO produit;
        try {
            produit = restTemplate.getForObject(
                    produitServiceUrl + "/api/produits/" + lcReq.getProduitId(),
                    ProduitInfoDTO.class);
        } catch (RuntimeException e) {
            throw new RuntimeException("Produit introuvable ou service produit indisponible (ID: " + lcReq.getProduitId() + ")");
        }

        if (produit == null || produit.getId() == null) {
            throw new RuntimeException("Produit introuvable (ID: " + lcReq.getProduitId() + ")");
        }

        if (produit.getStock() == null || produit.getStock() < lcReq.getQuantite()) {
            throw new RuntimeException("Stock insuffisant pour le produit '" + produit.getNom() + "' (ID: " + lcReq.getProduitId() + ")");
        }

        // Le prix vient de produit-service, jamais du client, pour éviter toute manipulation du prix
        double prixReel = produit.getPrix() != null ? produit.getPrix().doubleValue() : 0.0;

        return new LigneCommande(commande, lcReq.getProduitId(), lcReq.getQuantite(), prixReel);
    }

    /**
     * Récupère toutes les commandes.
     * @return Une liste de toutes les commandes.
     */
    public List<Commande> getAllCommandes() {
        return commandeRepository.findAll();
    }

    /**
     * Récupère une commande par son ID.
     * @param id L'ID de la commande.
     * @return Un Optional contenant la commande si trouvée, vide sinon.
     */
    public Optional<Commande> getCommandeById(Long id) {
        return commandeRepository.findById(id);
    }

    /**
     * Récupère les commandes d'un client spécifique.
     * @param clientId L'ID du client.
     * @return Une liste des commandes du client.
     */
    public List<Commande> getCommandesByClientId(Long clientId) {
        return commandeRepository.findByClientId(clientId);
    }

    /**
     * Met à jour le statut d'une commande.
     * @param id L'ID de la commande à mettre à jour.
     * @param nouveauStatut Le nouveau statut de la commande.
     * @return Un Optional contenant la commande mise à jour si trouvée, vide sinon.
     */
    @Transactional
    public Optional<Commande> updateStatutCommande(Long id, StatutCommande nouveauStatut) {
        return commandeRepository.findById(id).map(commande -> {
            commande.setStatut(nouveauStatut);
            return commandeRepository.save(commande);
        });
    }

    /**
     * Annule une commande par son ID.
     * @param id L'ID de la commande à annuler.
     * @return true si la commande a été annulée avec succès, false sinon.
     */
    @Transactional
    public boolean annulerCommande(Long id) {
        return commandeRepository.findById(id).map(commande -> {
            commande.setStatut(StatutCommande.ANNULEE);
            commandeRepository.save(commande);
            return true;
        }).orElse(false);
    }

    /**
     * Supprime une commande par son ID.
     * @param id L'ID de la commande à supprimer.
     */
    @Transactional
    public void deleteCommande(Long id) {
        commandeRepository.deleteById(id);
    }
}

