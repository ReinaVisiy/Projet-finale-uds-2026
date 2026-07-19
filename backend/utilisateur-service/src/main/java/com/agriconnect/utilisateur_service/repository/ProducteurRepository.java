package com.agriconnect.utilisateur_service.repository;

import com.agriconnect.utilisateur_service.entity.Producteur;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProducteurRepository extends JpaRepository<Producteur, Long> {
}