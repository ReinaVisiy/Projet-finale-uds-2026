package com.agrycam.certificationservice.repository;

import com.agrycam.certificationservice.entity.Certification;
import com.agrycam.certificationservice.entity.StatutCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificationRepository extends JpaRepository<Certification, Long> {

    List<Certification> findByProducteurId(Long producteurId);

    List<Certification> findByStatut(StatutCertification statut);

    Optional<Certification> findFirstByProducteurIdAndStatutOrderByDateApprobationDesc(Long producteurId, StatutCertification statut);
}
