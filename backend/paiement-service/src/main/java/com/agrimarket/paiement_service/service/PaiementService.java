package com.agrimarket.paiement_service.service;

import com.agrimarket.paiement_service.client.CommandeClient;
import com.agrimarket.paiement_service.client.CommandeDTO;
import com.agrimarket.paiement_service.client.UtilisateurClient;
import com.agrimarket.paiement_service.client.UtilisateurDTO;
import com.agrimarket.paiement_service.entity.Paiement;
import com.agrimarket.paiement_service.enums.StatutPaiement;
import com.agrimarket.paiement_service.repository.PaiementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final CommandeClient commandeClient;
    private final UtilisateurClient utilisateurClient;

    public Paiement creerPaiement(Paiement paiement) {
        // Vérifie que la commande existe bien avant de créer le paiement
        CommandeDTO commande = commandeClient.getCommandeById(paiement.getCommandeId());
        if (commande == null) {
            throw new RuntimeException("Commande introuvable avec l'id: " + paiement.getCommandeId());
        }

        // Vérifie que l'utilisateur existe bien
        UtilisateurDTO utilisateur = utilisateurClient.getUtilisateurById(paiement.getConsommateurId());
        if (utilisateur == null) {
            throw new RuntimeException("Utilisateur introuvable avec l'id: " + paiement.getConsommateurId());
        }

        return paiementRepository.save(paiement);
    }

    public Paiement getPaiementById(Long id) {
        return paiementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable avec l'id: " + id));
    }

    public List<Paiement> getPaiementsByCommande(Long commandeId) {
        return paiementRepository.findByCommandeId(commandeId);
    }

    public List<Paiement> getPaiementsByConsommateur(Long consommateurId) {
        return paiementRepository.findByConsommateurId(consommateurId);
    }

    public Paiement mettreAJourStatut(Long id, StatutPaiement nouveauStatut) {
        Paiement paiement = getPaiementById(id);
        paiement.setStatut(nouveauStatut);
        return paiementRepository.save(paiement);
    }

    public List<Paiement> getAllPaiements() {
        return paiementRepository.findAll();
    }
}