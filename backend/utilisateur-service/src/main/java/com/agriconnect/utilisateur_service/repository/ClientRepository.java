package com.agriconnect.utilisateur_service.repository;

import com.agriconnect.utilisateur_service.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository extends JpaRepository<Client, Long> {
}