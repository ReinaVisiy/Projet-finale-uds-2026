package com.agrycam.commande.repository;

import com.agrycam.commande.model.Commande;
import com.agrycam.commande.model.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Interface de dépôt pour l'entité Commande.
 * Fournit des méthodes pour interagir avec la base de données pour les commandes.
 */
@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {
    List<Commande> findByClientId(Long clientId);

    List<Commande> findByProducteurId(Long producteurId);

    long countByStatut(StatutCommande statut);

    // Commandes expediees depuis plus de 72h, encore en attente de
    // confirmation client : cibles du job d'auto-confirmation.
    List<Commande> findByStatutAndDateExpeditionBefore(StatutCommande statut, LocalDateTime seuil);
}
