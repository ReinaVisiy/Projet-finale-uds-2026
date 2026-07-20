package com.agrycam.commande.service;

import com.agrycam.commande.client.PaiementServiceClient;
import com.agrycam.commande.exception.AccesRefuseException;
import com.agrycam.commande.model.Commande;
import com.agrycam.commande.model.Litige;
import com.agrycam.commande.model.StatutCommande;
import com.agrycam.commande.model.StatutLitige;
import com.agrycam.commande.model.TypeLitige;
import com.agrycam.commande.repository.CommandeRepository;
import com.agrycam.commande.repository.LitigeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service metier pour les litiges (disputes) ouverts par les clients sur
 * leurs commandes. Section 3 du cahier des charges : seul le type
 * PRODUIT_NON_LIVRE beneficie d'un remboursement automatique en un clic,
 * les autres types (endommage, qualite, quantite...) restent des cas
 * d'arbitrage manuel entre admin, client et vendeur.
 */
@Service
public class LitigeService {

    @Autowired
    private LitigeRepository litigeRepository;

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private PaiementServiceClient paiementServiceClient;

    /**
     * Ouvre un litige sur une commande. Seul le client proprietaire de la
     * commande peut le faire, et uniquement une fois la commande expediee
     * (avant, il n'y a rien a contester : la commande peut simplement
     * etre annulee via le circuit normal).
     */
    @Transactional
    public Litige creerLitige(Long commandeId, Long clientId, TypeLitige type, String description) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> new RuntimeException("Commande introuvable (ID: " + commandeId + ")"));

        if (!clientId.equals(commande.getClientId())) {
            throw new AccesRefuseException("Seul le client de cette commande peut ouvrir un litige.");
        }

        if (commande.getStatut() != StatutCommande.EXPEDIEE && commande.getStatut() != StatutCommande.LIVREE) {
            throw new RuntimeException("Un litige ne peut etre ouvert que sur une commande expediee ou livree (statut actuel : " + commande.getStatut() + ").");
        }

        Litige litige = new Litige(commandeId, clientId, type, description);
        return litigeRepository.save(litige);
    }

    /**
     * Liste tous les litiges (role admin), avec le flag fondsDejaRetires
     * calcule pour chacun.
     */
    public List<Litige> listerTousLesLitiges() {
        return litigeRepository.findAll();
    }

    /**
     * Liste les litiges ouverts par un client donne.
     */
    public List<Litige> listerLitigesClient(Long clientId) {
        return litigeRepository.findByClientId(clientId);
    }

    public Optional<Litige> getLitigeById(Long id) {
        return litigeRepository.findById(id);
    }

    /**
     * Calcule le flag "fonds deja retires" d'un litige en interrogeant
     * paiement-service. Uniquement pertinent pour PRODUIT_NON_LIVRE ;
     * renvoie null pour les autres types (pas de remboursement automatique
     * de toute facon) et si le statut est indetermine.
     */
    public Boolean calculerFondsDejaRetires(Litige litige) {
        if (litige.getType() != TypeLitige.PRODUIT_NON_LIVRE || litige.getStatut() != StatutLitige.OUVERT) {
            return null;
        }
        return paiementServiceClient.estFondsLiberes(litige.getCommandeId());
    }

    /**
     * Resout un litige "Produit non livré" par remboursement en un clic :
     * declenche le remboursement integral cote paiement-service, annule
     * la commande (sans repasser par le circuit client 90/10), et marque
     * le litige RESOLU. Reserve a l'admin (verifie par le controller).
     */
    @Transactional
    public Litige rembourserLitige(Long litigeId) {
        Litige litige = litigeRepository.findById(litigeId)
                .orElseThrow(() -> new RuntimeException("Litige introuvable (ID: " + litigeId + ")"));

        if (litige.getType() != TypeLitige.PRODUIT_NON_LIVRE) {
            throw new AccesRefuseException("Le remboursement en un clic n'est disponible que pour les litiges de type 'Produit non livré'. Traitez ce litige manuellement.");
        }
        if (litige.getStatut() != StatutLitige.OUVERT) {
            throw new RuntimeException("Ce litige a deja ete traite (statut : " + litige.getStatut() + ").");
        }

        // Propage l'exception si paiement-service refuse (ex. fonds deja
        // liberes) : l'admin doit voir l'echec, pas un faux succes.
        paiementServiceClient.notifierRemboursementLitige(litige.getCommandeId());

        // Annule la commande directement (sans passer par
        // CommandeService#updateStatutCommande, qui declencherait a tort
        // le remboursement 90/10 destine aux annulations client).
        Commande commande = commandeRepository.findById(litige.getCommandeId())
                .orElseThrow(() -> new RuntimeException("Commande introuvable (ID: " + litige.getCommandeId() + ")"));
        commande.setStatut(StatutCommande.ANNULEE);
        commandeRepository.save(commande);

        litige.setStatut(StatutLitige.RESOLU);
        litige.setDateResolution(LocalDateTime.now());
        return litigeRepository.save(litige);
    }

    /**
     * Resolution manuelle d'un litige (types autres que PRODUIT_NON_LIVRE,
     * ou rejet d'un litige PRODUIT_NON_LIVRE non fonde) : aucun mouvement
     * financier automatique, l'admin tranche apres examen des preuves.
     */
    @Transactional
    public Litige resoudreLitigeManuellement(Long litigeId, StatutLitige nouveauStatut) {
        if (nouveauStatut == StatutLitige.OUVERT) {
            throw new IllegalArgumentException("Impossible de repasser un litige a OUVERT.");
        }
        Litige litige = litigeRepository.findById(litigeId)
                .orElseThrow(() -> new RuntimeException("Litige introuvable (ID: " + litigeId + ")"));
        if (litige.getStatut() != StatutLitige.OUVERT) {
            throw new RuntimeException("Ce litige a deja ete traite (statut : " + litige.getStatut() + ").");
        }
        litige.setStatut(nouveauStatut);
        litige.setDateResolution(LocalDateTime.now());
        return litigeRepository.save(litige);
    }
}
