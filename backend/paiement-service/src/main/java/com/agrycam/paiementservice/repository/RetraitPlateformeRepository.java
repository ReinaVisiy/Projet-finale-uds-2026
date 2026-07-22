package com.agrycam.paiementservice.repository;

import com.agrycam.paiementservice.entity.RetraitPlateforme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RetraitPlateformeRepository extends JpaRepository<RetraitPlateforme, Long> {

    List<RetraitPlateforme> findAllByOrderByDateDemandeDesc();
}
