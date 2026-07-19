package com.agrycam.produitservice.repository;

import com.agrycam.produitservice.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Long> {

    List<Produit> findByProducteurId(Long producteurId);

    @Query("SELECT p FROM Produit p WHERE p.stock > 0 ORDER BY p.dateAjout DESC")
    List<Produit> trouverEnStock();
}
