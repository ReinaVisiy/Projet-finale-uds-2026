package com.agrycam.messageservice.service;

import com.agrycam.messageservice.dto.MessageRequest;
import com.agrycam.messageservice.dto.MessageResponse;
import com.agrycam.messageservice.entity.Message;
import com.agrycam.messageservice.repository.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    // Data URL base64 : ~1.37 octet encode par octet source. 3 000 000
    // caracteres ~= 2,1 Mo d'image d'origine, largement suffisant pour une
    // photo de conversation sans alourdir la base (colonne TEXT partagee
    // avec les autres messages de la conversation).
    private static final int TAILLE_MAX_IMAGE_BASE64 = 3_000_000;

    public MessageResponse envoyer(MessageRequest request, Long expediteurId, String expediteurNom, String destinataireNom) {
        if (expediteurId.equals(request.getDestinataireId())) {
            throw new RuntimeException("Vous ne pouvez pas vous envoyer un message à vous-même");
        }

        String contenu = request.getContenu() != null ? request.getContenu().trim() : "";
        String imageData = request.getImageData();

        if (contenu.isEmpty() && (imageData == null || imageData.isBlank())) {
            throw new RuntimeException("Le message doit contenir du texte ou une image");
        }
        if (imageData != null && imageData.length() > TAILLE_MAX_IMAGE_BASE64) {
            throw new RuntimeException("L'image est trop volumineuse (3 Mo maximum)");
        }

        Message message = Message.builder()
                .contenu(contenu)
                .imageData(imageData)
                .expediteurId(expediteurId)
                .destinataireId(request.getDestinataireId())
                .expediteurNom(expediteurNom)
                .destinataireNom(destinataireNom)
                .estLu(false)
                .estDelivre(false)
                .dateEnvoi(LocalDateTime.now())
                .build();

        Message savedMessage = messageRepository.save(message);
        return toResponse(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getConversation(Long autreUserId, Long currentUserId) {
        return messageRepository.findConversation(currentUserId, autreUserId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MessageResponse> getMesMessages(Long currentUserId) {
        List<Message> messages = messageRepository.findAllByUserId(currentUserId);
        
        List<MessageResponse> responses = new ArrayList<>();
        for (Message message : messages) {
            if (message.getDestinataireId().equals(currentUserId) && !message.getEstDelivre()) {
                message.setEstDelivre(true);
                messageRepository.save(message);
            }
            responses.add(toResponse(message));
        }
        
        return responses;
    }

    public MessageResponse marquerLu(Long messageId, Long currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé avec l'id : " + messageId));

        if (!message.getDestinataireId().equals(currentUserId)) {
            throw new RuntimeException("Vous ne pouvez pas marquer ce message comme lu");
        }

        message.setEstLu(true);
        Message savedMessage = messageRepository.save(message);
        return toResponse(savedMessage);
    }

    @Transactional(readOnly = true)
    public Long compterNonLus(Long currentUserId) {
        return messageRepository.countByDestinataireIdAndEstLuFalse(currentUserId);
    }

    public void supprimerConversation(Long autreUserId, Long currentUserId) {
        List<Message> conversation = messageRepository.findConversation(currentUserId, autreUserId);
        messageRepository.deleteAll(conversation);
    }

    // Suppression individuelle : seul l'expediteur peut supprimer son propre
    // message (comme sur WhatsApp "supprimer pour tous"). On conserve la
    // ligne (date, participants) mais on vide contenu/imageData et on passe
    // estSupprime a true ; le frontend affiche alors un placeholder a la
    // place du contenu original.
    public MessageResponse supprimerMessage(Long messageId, Long currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message non trouvé avec l'id : " + messageId));

        if (!message.getExpediteurId().equals(currentUserId)) {
            throw new RuntimeException("Vous ne pouvez supprimer que vos propres messages");
        }

        message.setEstSupprime(true);
        // contenu est NOT NULL en base (cf. Message#contenu) : on vide avec
        // une chaine vide plutot que null. imageData, lui, est nullable.
        message.setContenu("");
        message.setImageData(null);
        Message savedMessage = messageRepository.save(message);
        return toResponse(savedMessage);
    }

    private MessageResponse toResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getContenu(),
                message.getImageData(),
                message.getDateEnvoi(),
                message.getEstLu(),
                message.getEstDelivre(),
                message.getEstSupprime(),
                message.getExpediteurId(),
                message.getExpediteurNom(),
                message.getDestinataireId(),
                message.getDestinataireNom()
        );
    }
}
