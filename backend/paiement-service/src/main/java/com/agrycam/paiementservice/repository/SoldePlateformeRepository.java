package com.agrycam.paiementservice.repository;

import com.agrycam.paiementservice.entity.SoldePlateforme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SoldePlateformeRepository extends JpaRepository<SoldePlateforme, Long> {

    // Ligne unique (singleton) : on prend toujours la premiere creee.
    Optional<SoldePlateforme> findFirstByOrderByIdAsc();
}
