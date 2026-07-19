package com.agrycam.certificationservice.repository;

import com.agrycam.certificationservice.entity.Certification;
import com.agrycam.certificationservice.entity.StatutCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificationRepository extends JpaRepository<Certification, Long> {

    List<Certification> findByProducteurId(Long producteurId);

    List<Certification> findByStatut(StatutCertification statut);

    Optional<Certification> findFirstByProducteurIdAndStatutOrderByDateApprobationDesc(Long producteurId, StatutCertification statut);

    // Utilisé pour la stat publique "Producteurs vérifiés" de la page d'accueil :
    // un producteur peut avoir plusieurs certifications, on ne veut compter
    // chaque producteur qu'une seule fois.
    @Query("SELECT COUNT(DISTINCT c.producteurId) FROM Certification c WHERE c.statut = :statut")
    long countProducteursDistinctsByStatut(@Param("statut") StatutCertification statut);
}
