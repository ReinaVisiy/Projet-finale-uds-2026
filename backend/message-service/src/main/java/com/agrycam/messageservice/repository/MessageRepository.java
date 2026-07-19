package com.agrycam.messageservice.repository;

import com.agrycam.messageservice.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.expediteurId = :userId1 AND m.destinataireId = :userId2) OR (m.expediteurId = :userId2 AND m.destinataireId = :userId1) ORDER BY m.dateEnvoi ASC")
    List<Message> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT m FROM Message m WHERE m.expediteurId = :userId OR m.destinataireId = :userId ORDER BY m.dateEnvoi DESC")
    List<Message> findAllByUserId(@Param("userId") Long userId);

    List<Message> findByDestinataireIdAndEstLuFalse(Long destinataireId);

    Long countByDestinataireIdAndEstLuFalse(Long destinataireId);
}
