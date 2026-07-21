package com.agrycam.messageservice.controller;

import com.agrycam.messageservice.dto.MessageRequest;
import com.agrycam.messageservice.dto.MessageResponse;
import com.agrycam.messageservice.dto.UtilisateurInfoDTO;
import com.agrycam.messageservice.service.MessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;
    private final RestTemplate restTemplate;

    @Value("${services.utilisateur-service.url}")
    private String utilisateurServiceUrl;

    public MessageController(MessageService messageService, RestTemplate restTemplate) {
        this.messageService = messageService;
        this.restTemplate = restTemplate;
    }

    @PostMapping("/envoyer")
    public ResponseEntity<MessageResponse> envoyer(@RequestBody MessageRequest request, Authentication authentication) {
        Long expediteurId = (Long) authentication.getPrincipal();

        String expediteurNom = fetchNom(expediteurId);
        String destinataireNom = fetchNom(request.getDestinataireId());

        MessageResponse response = messageService.envoyer(request, expediteurId, expediteurNom, destinataireNom);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversation/{autreUserId}")
    public ResponseEntity<List<MessageResponse>> getConversation(@PathVariable Long autreUserId, Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        List<MessageResponse> conversation = messageService.getConversation(autreUserId, currentUserId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/mes-messages")
    public ResponseEntity<List<MessageResponse>> getMesMessages(Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        List<MessageResponse> messages = messageService.getMesMessages(currentUserId);
        return ResponseEntity.ok(messages);
    }

    @PutMapping("/lire/{messageId}")
    public ResponseEntity<MessageResponse> marquerLu(@PathVariable Long messageId, Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        MessageResponse response = messageService.marquerLu(messageId, currentUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/non-lus")
    public ResponseEntity<Long> compterNonLus(Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        Long nonLusCount = messageService.compterNonLus(currentUserId);
        return ResponseEntity.ok(nonLusCount);
    }

    @DeleteMapping("/conversation/{autreUserId}")
    public ResponseEntity<String> supprimerConversation(@PathVariable Long autreUserId, Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        messageService.supprimerConversation(autreUserId, currentUserId);
        return ResponseEntity.ok("Conversation supprimee avec succes");
    }

    private String fetchNom(Long uid) {
        try {
            String url = utilisateurServiceUrl + "/api/utilisateurs/" + uid;
            UtilisateurInfoDTO utilisateur = restTemplate.getForObject(url, UtilisateurInfoDTO.class);
            return (utilisateur != null && utilisateur.getNom() != null) ? utilisateur.getNom() : "Utilisateur inconnu";
        } catch (RestClientException e) {
            // utilisateur-service indisponible : on degrade sans bloquer l'envoi du message
            return "Utilisateur inconnu";
        }
    }
}