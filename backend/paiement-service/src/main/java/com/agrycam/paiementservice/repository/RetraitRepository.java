package com.agrycam.paiementservice.repository;

import com.agrycam.paiementservice.entity.Retrait;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RetraitRepository extends JpaRepository<Retrait, Long> {
    
    List<Retrait> findByVendeurId(Long vendeurId);
}
