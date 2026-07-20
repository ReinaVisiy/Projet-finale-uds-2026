package com.agrycam.avisservice.repository;

import com.agrycam.avisservice.entity.Avis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvisRepository extends JpaRepository<Avis, Long> {

    List<Avis> findByProduitId(Long produitId);

    List<Avis> findByClientIdOrderByDateDesc(Long clientId);

    Optional<Avis> findByClientIdAndProduitId(Long clientId, Long produitId);

    @Query("SELECT AVG(a.note) FROM Avis a WHERE a.produitId = :produitId")
    Double getNoteMoyenne(@Param("produitId") Long produitId);

    @Query("SELECT COUNT(a) FROM Avis a WHERE a.produitId = :produitId")
    Long getNombreAvis(@Param("produitId") Long produitId);
}
