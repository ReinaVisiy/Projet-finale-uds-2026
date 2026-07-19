package com.agrycam.signalement.service;

import com.agrycam.signalement.dto.ProduitInfoDTO;
import com.agrycam.signalement.dto.UtilisateurInfoDTO;
import com.agrycam.signalement.model.Signalement;
import com.agrycam.signalement.model.StatutSignalement;
import com.agrycam.signalement.model.TypeSignalement;
import com.agrycam.signalement.payload.request.SignalementRequest;
import com.agrycam.signalement.repository.SignalementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service pour la gestion des opérations liées aux signalements.
 * Contient la logique métier pour créer, consulter, mettre à jour et traiter des signalements.
 */
@Service
public class SignalementService {

    @Autowired
    private SignalementRepository signalementRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${produit.service.url}")
    private String produitServiceUrl;

    @Value("${utilisateur.service.url}")
    private String utilisateurServiceUrl;

    /**
     * Crée un nouveau signalement à partir d'une requête de signalement.
     * Vérifie que l'utilisateur qui signale et la cible (produit ou utilisateur) existent réellement.
     * @param signalementRequest La requête contenant les détails du signalement.
     * @return Le signalement créé.
     */
    @Transactional
    public Signalement createSignalement(SignalementRequest signalementRequest) {
        verifierUtilisateurExiste(signalementRequest.getReporterId(), "L'utilisateur qui signale");
        verifierCibleExiste(signalementRequest.getTargetId(), signalementRequest.getType());

        Signalement signalement = new Signalement(
                signalementRequest.getType(),
                signalementRequest.getTargetId(),
                signalementRequest.getReporterId(),
                signalementRequest.getRaison()
        );
        return signalementRepository.save(signalement);
    }

    /**
     * Vérifie qu'un utilisateur existe dans utilisateur-service.
     * @param userId L'ID à vérifier.
     * @param label Description utilisée dans le message d'erreur.
     */
    private void verifierUtilisateurExiste(Long userId, String label) {
        try {
            UtilisateurInfoDTO utilisateur = restTemplate.getForObject(
                    utilisateurServiceUrl + "/api/utilisateurs/" + userId,
                    UtilisateurInfoDTO.class);
            if (utilisateur == null || utilisateur.getId() == null) {
                throw new RuntimeException(label + " est introuvable (ID: " + userId + ")");
            }
        } catch (RuntimeException e) {
            throw new RuntimeException(label + " est introuvable ou utilisateur-service est indisponible (ID: " + userId + ")");
        }
    }

    /**
     * Vérifie que la cible du signalement (produit ou utilisateur) existe réellement,
     * en appelant le microservice correspondant selon le type.
     * @param targetId L'ID de la cible.
     * @param type Le type de cible (PRODUIT ou UTILISATEUR).
     */
    private void verifierCibleExiste(Long targetId, TypeSignalement type) {
        if (type == TypeSignalement.PRODUIT) {
            try {
                ProduitInfoDTO produit = restTemplate.getForObject(
                        produitServiceUrl + "/api/produits/" + targetId,
                        ProduitInfoDTO.class);
                if (produit == null || produit.getId() == null) {
                    throw new RuntimeException("Le produit signalé est introuvable (ID: " + targetId + ")");
                }
            } catch (RuntimeException e) {
                throw new RuntimeException("Le produit signalé est introuvable ou produit-service est indisponible (ID: " + targetId + ")");
            }
        } else {
            verifierUtilisateurExiste(targetId, "L'utilisateur signalé");
        }
    }

    /**
     * Récupère tous les signalements.
     * @return Une liste de tous les signalements.
     */
    public List<Signalement> getAllSignalements() {
        return signalementRepository.findAll();
    }

    /**
     * Récupère un signalement par son ID.
     * @param id L'ID du signalement.
     * @return Un Optional contenant le signalement si trouvé, vide sinon.
     */
    public Optional<Signalement> getSignalementById(Long id) {
        return signalementRepository.findById(id);
    }

    /**
     * Récupère les signalements faits par un utilisateur spécifique.
     * @param reporterId L'ID de l'utilisateur qui a fait le signalement.
     * @return Une liste des signalements faits par l'utilisateur.
     */
    public List<Signalement> getSignalementsByReporterId(Long reporterId) {
        return signalementRepository.findByReporterId(reporterId);
    }

    /**
     * Récupère les signalements d'une cible spécifique (produit ou utilisateur).
     * @param targetId L'ID de la cible.
     * @param type Le type de la cible (PRODUIT ou UTILISATEUR).
     * @return Une liste des signalements concernant la cible.
     */
    public List<Signalement> getSignalementsByTargetIdAndType(Long targetId, TypeSignalement type) {
        return signalementRepository.findByTargetIdAndType(targetId, type);
    }

    /**
     * Récupère les signalements par leur statut.
     * @param statut Le statut du signalement.
     * @return Une liste des signalements ayant le statut spécifié.
     */
    public List<Signalement> getSignalementsByStatut(StatutSignalement statut) {
        return signalementRepository.findByStatut(statut);
    }

    /**
     * Met à jour le statut d'un signalement.
     * Vérifie que l'administrateur qui traite le signalement existe réellement.
     * @param id L'ID du signalement à mettre à jour.
     * @param nouveauStatut Le nouveau statut du signalement.
     * @param administrateurId L'ID de l'administrateur qui traite le signalement (peut être null).
     * @return Un Optional contenant le signalement mis à jour si trouvé, vide sinon.
     */
    @Transactional
    public Optional<Signalement> updateStatutSignalement(Long id, StatutSignalement nouveauStatut, Long administrateurId) {
        if (administrateurId != null
                && (nouveauStatut == StatutSignalement.RESOLU || nouveauStatut == StatutSignalement.REJETE)) {
            verifierUtilisateurExiste(administrateurId, "L'administrateur");
        }

        return signalementRepository.findById(id).map(signalement -> {
            signalement.setStatut(nouveauStatut);
            if (nouveauStatut == StatutSignalement.RESOLU || nouveauStatut == StatutSignalement.REJETE) {
                signalement.setDateResolution(LocalDateTime.now());
                signalement.setAdministrateurId(administrateurId);
            }
            return signalementRepository.save(signalement);
        });
    }

    /**
     * Supprime un signalement par son ID.
     * @param id L'ID du signalement à supprimer.
     */
    @Transactional
    public void deleteSignalement(Long id) {
        signalementRepository.deleteById(id);
    }
}

