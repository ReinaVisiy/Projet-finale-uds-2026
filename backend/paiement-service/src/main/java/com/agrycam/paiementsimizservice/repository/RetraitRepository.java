package com.agrycam.paiementsimizservice.repository;

import com.agrycam.paiementsimizservice.entity.Retrait;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RetraitRepository extends JpaRepository<Retrait, Long> {
    
    List<Retrait> findByVendeurId(Long vendeurId);
}
