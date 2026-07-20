package com.agrycam.paiementsimizservice.repository;

import com.agrycam.paiementsimizservice.entity.Transaction;
import com.agrycam.paiementsimizservice.entity.TypeReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    Optional<Transaction> findByTypeReferenceAndReferenceId(TypeReference typeReference, Long referenceId);
    
    List<Transaction> findByVendeurId(Long vendeurId);
    
    Optional<Transaction> findBySimizSessionId(String simizSessionId);
}
