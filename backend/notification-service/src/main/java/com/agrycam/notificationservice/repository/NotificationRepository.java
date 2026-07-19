package com.agrycam.notificationservice.repository;

import com.agrycam.notificationservice.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDestinataireIdOrderByDateEnvoiDesc(Long destinataireId);
    Long countByDestinataireIdAndLuFalse(Long destinataireId);
    List<Notification> findAllByDestinataireIdAndLuFalse(Long destinataireId);
}
