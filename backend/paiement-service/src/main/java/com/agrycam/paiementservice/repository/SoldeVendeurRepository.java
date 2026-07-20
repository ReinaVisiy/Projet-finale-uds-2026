package com.agrycam.paiementservice.repository;

import com.agrycam.paiementservice.entity.SoldeVendeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SoldeVendeurRepository extends JpaRepository<SoldeVendeur, Long> {
    
    Optional<SoldeVendeur> findByVendeurId(Long vendeurId);
}
