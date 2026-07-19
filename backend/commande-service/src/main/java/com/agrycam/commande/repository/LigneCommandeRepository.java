package com.agrycam.commande.repository;

import com.agrycam.commande.model.LigneCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Interface de dépôt pour l'entité LigneCommande.
 * Fournit des méthodes pour interagir avec la base de données pour les lignes de commande.
 */
@Repository
public interface LigneCommandeRepository extends JpaRepository<LigneCommande, Long> {
}
