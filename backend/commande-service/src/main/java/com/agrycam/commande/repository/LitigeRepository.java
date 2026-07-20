package com.agrycam.commande.repository;

import com.agrycam.commande.model.Litige;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LitigeRepository extends JpaRepository<Litige, Long> {

    List<Litige> findByClientId(Long clientId);

    List<Litige> findByCommandeId(Long commandeId);
}
