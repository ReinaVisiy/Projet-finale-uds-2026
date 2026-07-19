package com.agrimarket.paiement_service.repository;

import com.agrimarket.paiement_service.entity.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    List<Paiement> findByCommandeId(Long commandeId);

    List<Paiement> findByConsommateurId(Long consommateurId);
}

