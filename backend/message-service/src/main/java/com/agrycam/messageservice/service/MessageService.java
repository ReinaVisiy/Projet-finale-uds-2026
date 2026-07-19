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

    public MessageResponse envoyer(MessageRequest request, Long expediteurId, String expediteurNom, String destinataireNom) {
        if (expediteurId.equals(request.getDestinataireId())) {
            throw new RuntimeException("Vous ne pouvez pas vous envoyer un message à vous-même");
        }

        Message message = Message.builder()
                .contenu(request.getContenu())
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

    private MessageResponse toResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getContenu(),
                message.getDateEnvoi(),
                message.getEstLu(),
                message.getEstDelivre(),
                message.getExpediteurId(),
                message.getExpediteurNom(),
                message.getDestinataireId(),
                message.getDestinataireNom()
        );
    }
}
