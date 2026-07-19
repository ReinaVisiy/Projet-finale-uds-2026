package com.agrycam.signalement.repository;

import com.agrycam.signalement.model.Signalement;
import com.agrycam.signalement.model.StatutSignalement;
import com.agrycam.signalement.model.TypeSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Interface de dépôt pour l'entité Signalement.
 * Fournit des méthodes pour interagir avec la base de données pour les signalements.
 */
@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    List<Signalement> findByReporterId(Long reporterId);
    List<Signalement> findByTargetIdAndType(Long targetId, TypeSignalement type);
    List<Signalement> findByStatut(StatutSignalement statut);
}
