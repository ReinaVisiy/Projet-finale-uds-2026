package com.agrycam.commande.repository;

import com.agrycam.commande.model.Commande;
import com.agrycam.commande.model.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Interface de dépôt pour l'entité Commande.
 * Fournit des méthodes pour interagir avec la base de données pour les commandes.
 */
@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {
    List<Commande> findByClientId(Long clientId);

    long countByStatut(StatutCommande statut);
}
