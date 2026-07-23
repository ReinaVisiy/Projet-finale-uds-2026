package com.agrycam.avisservice.service;

import com.agrycam.avisservice.dto.AvisRequest;
import com.agrycam.avisservice.dto.AvisResponse;
import com.agrycam.avisservice.dto.UtilisateurInfoDTO;
import com.agrycam.avisservice.entity.Avis;
import com.agrycam.avisservice.repository.AvisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvisService {

    private final AvisRepository avisRepository;
    private final RestTemplate restTemplate;

    @Value("${services.utilisateur-service.url}")
    private String utilisateurServiceUrl;

    public AvisResponse publier(AvisRequest request, Long clientId) {

        if (clientId == null) {
            throw new RuntimeException("Client ID is required");
        }

        if (request.getProduitId() == null) {
            throw new RuntimeException("Produit ID is required");
        }

        if (avisRepository.findByClientIdAndProduitId(clientId, request.getProduitId()).isPresent()) {
            throw new RuntimeException("You have already left a review for this product");
        }

        if (request.getNote() < 1 || request.getNote() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        Avis avis = new Avis();
        avis.setNote(request.getNote());
        avis.setCommentaire(request.getCommentaire());
        avis.setClientId(clientId);
        avis.setProduitId(request.getProduitId());

        avisRepository.save(avis);

        return toResponse(avis);
    }

    public AvisResponse modifier(Long avisId, AvisRequest request, Long clientId) {
        Avis avis = avisRepository.findById(avisId)
                .orElseThrow(() -> new RuntimeException("Avis introuvable"));

        if (!avis.getClientId().equals(clientId)) {
            throw new RuntimeException("Vous ne pouvez modifier que vos propres avis");
        }

        if (request.getNote() < 1 || request.getNote() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        avis.setNote(request.getNote());
        avis.setCommentaire(request.getCommentaire());

        avisRepository.save(avis);

        return toResponse(avis);
    }

    public void supprimer(Long avisId, Long clientId) {
        Avis avis = avisRepository.findById(avisId)
                .orElseThrow(() -> new RuntimeException("Avis introuvable"));

        if (!avis.getClientId().equals(clientId)) {
            throw new RuntimeException("Vous ne pouvez supprimer que vos propres avis");
        }

        avisRepository.delete(avis);
    }

    public List<AvisResponse> getParProduit(Long produitId) {
        return avisRepository.findByProduitId(produitId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Tous les avis publiés par un client donné, du plus récent au plus
    // ancien : utilisé par le profil public (onglet "Avis laissés").
    public List<AvisResponse> getParClient(Long clientId) {
        return avisRepository.findByClientIdOrderByDateDesc(clientId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Double getNoteMoyenne(Long produitId) {
        Double moyenne = avisRepository.getNoteMoyenne(produitId);
        return moyenne != null ? moyenne : 0.0;
    }

    public Long getNombreAvis(Long produitId) {
        return avisRepository.getNombreAvis(produitId);
    }

    // ---- Avis "plateforme" (satisfaction générale, proposé à la déconnexion) ----

    /** Publie un avis sur la plateforme (pas de produit associé). Un seul par client. */
    public AvisResponse publierAvisPlateforme(AvisRequest request, Long clientId) {

        if (clientId == null) {
            throw new RuntimeException("Client ID is required");
        }

        if (request.getNote() == null || request.getNote() < 1 || request.getNote() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        if (avisRepository.findByClientIdAndProduitIdIsNull(clientId).isPresent()) {
            throw new RuntimeException("Vous avez déjà évalué la plateforme");
        }

        Avis avis = new Avis();
        avis.setNote(request.getNote());
        avis.setCommentaire(request.getCommentaire());
        avis.setClientId(clientId);
        avis.setProduitId(null);

        avisRepository.save(avis);

        return toResponse(avis);
    }

    /** Tous les avis plateforme, meilleure note en premier (utilisé pour le top 3 + "voir plus"). */
    public List<AvisResponse> getAvisPlateforme() {
        return avisRepository.findByProduitIdIsNullOrderByNoteDescDateDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Double getNoteMoyennePlateforme() {
        Double moyenne = avisRepository.getNoteMoyennePlateforme();
        return moyenne != null ? moyenne : 0.0;
    }

    public Long getNombreAvisPlateforme() {
        return avisRepository.getNombreAvisPlateforme();
    }

    /** Le client a-t-il déjà laissé un avis sur la plateforme ? Utilisé pour décider d'afficher le pop-up à la déconnexion. */
    public boolean aDejaEvaluePlateforme(Long clientId) {
        if (clientId == null) {
            return false;
        }
        return avisRepository.findByClientIdAndProduitIdIsNull(clientId).isPresent();
    }

    private AvisResponse toResponse(Avis avis) {
        return new AvisResponse(
                avis.getId(),
                avis.getNote(),
                avis.getCommentaire(),
                avis.getDate(),
                avis.getClientId(),
                fetchNom(avis.getClientId()),
                avis.getProduitId()
        );
    }

    private String fetchNom(Long clientId) {
        try {
            String url = utilisateurServiceUrl + "/api/utilisateurs/" + clientId;
            UtilisateurInfoDTO utilisateur = restTemplate.getForObject(url, UtilisateurInfoDTO.class);
            return (utilisateur != null && utilisateur.getNom() != null) ? utilisateur.getNom() : "Utilisateur inconnu";
        } catch (RestClientException e) {
            // utilisateur-service indisponible : on degrade sans bloquer la lecture des avis
            return "Utilisateur inconnu";
        }
    }
}