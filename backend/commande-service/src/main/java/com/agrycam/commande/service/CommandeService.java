package com.agrycam.commande.service;

import com.agrycam.commande.client.PaiementServiceClient;
import com.agrycam.commande.dto.ProduitInfoDTO;
import com.agrycam.commande.dto.UtilisateurInfoDTO;
import com.agrycam.commande.exception.AccesRefuseException;
import com.agrycam.commande.model.Commande;
import com.agrycam.commande.model.LigneCommande;
import com.agrycam.commande.model.StatutCommande;
import com.agrycam.commande.payload.request.CommandeRequest;
import com.agrycam.commande.payload.request.LigneCommandeRequest;
import com.agrycam.commande.repository.CommandeRepository;
import com.agrycam.commande.repository.LigneCommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des opérations liées aux commandes.
 * Contient la logique métier pour créer, consulter, mettre à jour et annuler des commandes.
 */
@Service
public class CommandeService {

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private LigneCommandeRepository ligneCommandeRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private PaiementServiceClient paiementServiceClient;

    @Value("${produit.service.url}")
    private String produitServiceUrl;

    // Stat publique pour la page d'accueil : uniquement un total, jamais les
    // commandes elles-mêmes (qui restent privées, cf. SecurityConfig).
    @Transactional(readOnly = true)
    public long compterCommandesLivrees() {
        return commandeRepository.countByStatut(StatutCommande.LIVREE);
    }

    @Value("${utilisateur.service.url}")
    private String utilisateurServiceUrl;

    /**
     * Crée une nouvelle commande à partir d'une requête de commande.
     * Valide l'existence du client et de chaque produit auprès des services
     * correspondants, et utilise le prix réel du produit plutôt que celui
     * fourni par le client (pour éviter toute manipulation du prix).
     * @param commandeRequest La requête contenant les détails de la commande.
     * @return La commande créée.
     */
    @Transactional
    public Commande createCommande(CommandeRequest commandeRequest) {
        // Vérifie que le client existe réellement dans utilisateur-service
        verifierClientExiste(commandeRequest.getClientId());

        Commande commande = new Commande(commandeRequest.getClientId());

        // On récupère les infos produit une seule fois par ligne (prix réel +
        // producteur), pour éviter un double appel réseau vers produit-service.
        List<ProduitInfoDTO> produitsInfo = commandeRequest.getLignesCommande().stream()
                .map(lcReq -> recupererProduitInfo(lcReq.getProduitId(), lcReq.getQuantite()))
                .collect(Collectors.toList());

        // Une Commande n'a plus qu'un seul vendeur : le frontend est censé
        // scinder un panier multi-vendeurs en une requête par vendeur avant
        // d'appeler cet endpoint. On vérifie ici que c'est bien le cas
        // plutôt que de faire confiance silencieusement au client.
        Long producteurId = produitsInfo.stream()
                .map(ProduitInfoDTO::getProducteurId)
                .distinct()
                .reduce((a, b) -> {
                    throw new RuntimeException("Une commande ne peut contenir des produits que d'un seul vendeur. Séparez le panier par vendeur avant de commander.");
                })
                .orElse(null);
        commande.setProducteurId(producteurId);

        List<LigneCommande> lignesCommande = new java.util.ArrayList<>();
        for (int i = 0; i < commandeRequest.getLignesCommande().size(); i++) {
            LigneCommandeRequest lcReq = commandeRequest.getLignesCommande().get(i);
            ProduitInfoDTO produit = produitsInfo.get(i);
            double prixReel = produit.getPrix() != null ? produit.getPrix().doubleValue() : 0.0;
            lignesCommande.add(new LigneCommande(commande, lcReq.getProduitId(), lcReq.getQuantite(), prixReel));
        }

        commande.setLignesCommande(lignesCommande);
        return commandeRepository.save(commande);
    }

    /**
     * Vérifie qu'un utilisateur existe dans utilisateur-service.
     * @param clientId L'ID du client à vérifier.
     * @throws RuntimeException si le client n'existe pas ou si utilisateur-service est injoignable.
     */
    private void verifierClientExiste(Long clientId) {
        try {
            UtilisateurInfoDTO utilisateur = restTemplate.getForObject(
                    utilisateurServiceUrl + "/api/utilisateurs/" + clientId,
                    UtilisateurInfoDTO.class);
            if (utilisateur == null || utilisateur.getId() == null) {
                throw new RuntimeException("Client introuvable (ID: " + clientId + ")");
            }
        } catch (RuntimeException e) {
            throw new RuntimeException("Client introuvable ou service utilisateur indisponible (ID: " + clientId + ")");
        }
    }

    /**
     * Récupère et valide les informations d'un produit auprès de produit-service :
     * existence, stock suffisant. Retourne le DTO complet (prix réel, producteur)
     * pour que l'appelant construise la ligne de commande et vérifie le vendeur.
     * @param produitId L'ID du produit à valider.
     * @param quantiteDemandee La quantité demandée dans la commande.
     * @return Le DTO du produit, avec son prix et son producteur réels.
     */
    private ProduitInfoDTO recupererProduitInfo(Long produitId, int quantiteDemandee) {
        ProduitInfoDTO produit;
        try {
            produit = restTemplate.getForObject(
                    produitServiceUrl + "/api/produits/" + produitId,
                    ProduitInfoDTO.class);
        } catch (RuntimeException e) {
            throw new RuntimeException("Produit introuvable ou service produit indisponible (ID: " + produitId + ")");
        }

        if (produit == null || produit.getId() == null) {
            throw new RuntimeException("Produit introuvable (ID: " + produitId + ")");
        }

        if (produit.getStock() == null || produit.getStock() < quantiteDemandee) {
            throw new RuntimeException("Stock insuffisant pour le produit '" + produit.getNom() + "' (ID: " + produitId + ")");
        }

        return produit;
    }

    /**
     * Récupère toutes les commandes.
     * @return Une liste de toutes les commandes.
     */
    public List<Commande> getAllCommandes() {
        return commandeRepository.findAll();
    }

    /**
     * Récupère une commande par son ID.
     * @param id L'ID de la commande.
     * @return Un Optional contenant la commande si trouvée, vide sinon.
     */
    public Optional<Commande> getCommandeById(Long id) {
        return commandeRepository.findById(id);
    }

    /**
     * Récupère les commandes d'un client spécifique.
     * @param clientId L'ID du client.
     * @return Une liste des commandes du client.
     */
    public List<Commande> getCommandesByClientId(Long clientId) {
        return commandeRepository.findByClientId(clientId);
    }

    /**
     * Récupère les commandes d'un vendeur spécifique.
     * @param producteurId L'ID du vendeur.
     * @return Une liste des commandes de ce vendeur.
     */
    public List<Commande> getCommandesByProducteurId(Long producteurId) {
        return commandeRepository.findByProducteurId(producteurId);
    }

    /**
     * Met à jour le statut d'une commande, en validant que l'appelant a le
     * droit de le faire et que la transition demandée est cohérente avec
     * le cycle de vie de la commande :
     *   EN_ATTENTE -> VALIDEE -> EN_PREPARATION -> EXPEDIEE -> LIVREE
     *   ANNULEE possible uniquement avant EXPEDIEE.
     * Les admins (y compris le token de service interne utilisé par
     * paiement-service) court-circuitent ces vérifications : ce sont des
     * transitions automatiques déclenchées par le système, pas par un
     * humain qui pourrait abuser d'un rôle qu'il n'a pas.
     * @param id L'ID de la commande à mettre à jour.
     * @param nouveauStatut Le nouveau statut demandé.
     * @param uid L'ID de l'utilisateur authentifié effectuant la demande.
     * @param estAdmin true si l'appelant est admin ou le service interne.
     * @param estProducteur true si l'appelant a le rôle producteur/vendeur.
     * @return Un Optional contenant la commande mise à jour si trouvée, vide sinon.
     */
    @Transactional
    public Optional<Commande> updateStatutCommande(Long id, StatutCommande nouveauStatut, Long uid, boolean estAdmin, boolean estProducteur) {
        return commandeRepository.findById(id).map(commande -> {
            if (!estAdmin) {
                validerTransition(commande, nouveauStatut, uid, estProducteur);
            }
            commande.setStatut(nouveauStatut);
            Commande sauvegardee = commandeRepository.save(commande);

            // Declenche la liberation du sequestre vers le solde disponible
            // du vendeur des que la livraison est confirmee (par le client
            // ou par le job d'auto-confirmation apres 72h).
            if (nouveauStatut == StatutCommande.LIVREE) {
                paiementServiceClient.notifierLivraison(sauvegardee.getId());
            }

            return sauvegardee;
        });
    }

    private void validerTransition(Commande commande, StatutCommande nouveau, Long uid, boolean estProducteur) {
        StatutCommande actuel = commande.getStatut();
        boolean estLeVendeur = estProducteur && uid != null && uid.equals(commande.getProducteurId());
        boolean estLeClient = uid != null && uid.equals(commande.getClientId());

        switch (nouveau) {
            case VALIDEE:
                if (!estLeVendeur) throw new AccesRefuseException("Seul le vendeur de cette commande peut la valider.");
                if (actuel != StatutCommande.EN_ATTENTE) throw new RuntimeException("Impossible de valider une commande qui n'est pas en attente (statut actuel : " + actuel + ").");
                break;
            case EN_PREPARATION:
                if (!estLeVendeur) throw new AccesRefuseException("Seul le vendeur de cette commande peut la passer en préparation.");
                if (actuel != StatutCommande.VALIDEE) throw new RuntimeException("Impossible de passer en préparation une commande qui n'est pas validée (statut actuel : " + actuel + ").");
                break;
            case EXPEDIEE:
                if (!estLeVendeur) throw new AccesRefuseException("Seul le vendeur de cette commande peut l'expédier.");
                if (actuel != StatutCommande.EN_PREPARATION) throw new RuntimeException("Impossible d'expédier une commande qui n'est pas en préparation (statut actuel : " + actuel + ").");
                break;
            case LIVREE:
                if (!estLeClient) throw new AccesRefuseException("Seul le client de cette commande peut confirmer la livraison.");
                if (actuel != StatutCommande.EXPEDIEE) throw new RuntimeException("Impossible de confirmer la livraison d'une commande qui n'a pas été expédiée (statut actuel : " + actuel + ").");
                break;
            case ANNULEE:
                if (!estLeClient) throw new AccesRefuseException("Seul le client de cette commande peut l'annuler.");
                if (actuel == StatutCommande.EXPEDIEE || actuel == StatutCommande.LIVREE || actuel == StatutCommande.ANNULEE) {
                    throw new RuntimeException("Cette commande ne peut plus être annulée une fois expédiée (statut actuel : " + actuel + ").");
                }
                break;
            case EN_ATTENTE:
                throw new AccesRefuseException("Le statut EN_ATTENTE est défini automatiquement à la création ou par le service de paiement ; il ne peut pas être défini manuellement.");
        }
    }

    /**
     * Annule une commande par son ID, en respectant les mêmes règles que
     * updateStatutCommande (seul le client propriétaire, avant expédition).
     * @param id L'ID de la commande à annuler.
     * @param uid L'ID de l'utilisateur authentifié effectuant la demande.
     * @return true si la commande a été annulée avec succès, false si non trouvée.
     */
    @Transactional
    public boolean annulerCommande(Long id, Long uid, boolean estAdmin) {
        return updateStatutCommande(id, StatutCommande.ANNULEE, uid, estAdmin, false).isPresent();
    }

    /**
     * Supprime une commande par son ID.
     * @param id L'ID de la commande à supprimer.
     */
    @Transactional
    public void deleteCommande(Long id) {
        commandeRepository.deleteById(id);
    }
}

