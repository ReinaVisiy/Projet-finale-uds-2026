package com.agrycam.produitservice.service;

import com.agrycam.produitservice.dto.AvisStatsDTO;
import com.agrycam.produitservice.dto.ProduitRequest;
import com.agrycam.produitservice.dto.ProduitResponse;
import com.agrycam.produitservice.dto.UtilisateurInfoDTO;
import com.agrycam.produitservice.entity.Categorie;
import com.agrycam.produitservice.entity.Produit;
import com.agrycam.produitservice.repository.CategorieRepository;
import com.agrycam.produitservice.repository.ProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final CategorieRepository categorieRepository;
    private final RestTemplate restTemplate;

    @Value("${avis.service.url}")
    private String avisServiceUrl;

    @Value("${certification.service.url}")
    private String certificationServiceUrl;

    @Value("${utilisateur.service.url}")
    private String utilisateurServiceUrl;

    @Transactional
    public ProduitResponse publier(ProduitRequest request, Long producteurId) {
        Produit produit = new Produit();
        produit.setNom(request.getNom());
        produit.setDescription(request.getDescription());
        produit.setPrix(request.getPrix());
        produit.setStock(request.getStock());
        produit.setImageUrl(request.getImageUrl());
        produit.setLocalisation(request.getLocalisation());
        produit.setProducteurId(producteurId);
        produit.setDisponible(true);

        if (request.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findById(request.getCategorieId())
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            produit.setCategorie(categorie);
        }

        Produit saved = produitRepository.save(produit);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProduitResponse> getAffichageParDefaut() {
        List<ProduitResponse> results = produitRepository.trouverEnStock().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return sortCertifiedFirst(results);
    }

    @Transactional(readOnly = true)
    public List<ProduitResponse> rechercher(
            String motCle,
            String localisation,
            Long categorieId,
            BigDecimal prixMin,
            BigDecimal prixMax,
            Integer stockMin,
            LocalDateTime dateLimite,
            Double noteMin,
            String tri) {

        List<Produit> baseList = produitRepository.trouverEnStock();
        Stream<Produit> stream = baseList.stream();

        if (motCle != null && !motCle.trim().isEmpty()) {
            String mc = motCle.toLowerCase();
            stream = stream.filter(p -> {
                boolean nomMatch = p.getNom() != null && p.getNom().toLowerCase().contains(mc);
                boolean descMatch = p.getDescription() != null && p.getDescription().toLowerCase().contains(mc);
                boolean catMatch = p.getCategorie() != null && p.getCategorie().getNom() != null 
                        && p.getCategorie().getNom().toLowerCase().contains(mc);
                return nomMatch || descMatch || catMatch;
            });
        }

        if (localisation != null && !localisation.trim().isEmpty()) {
            String loc = localisation.toLowerCase();
            stream = stream.filter(p -> p.getLocalisation() != null && p.getLocalisation().toLowerCase().contains(loc));
        }

        if (categorieId != null) {
            stream = stream.filter(p -> p.getCategorie() != null && p.getCategorie().getId().equals(categorieId));
        }

        if (prixMin != null) {
            stream = stream.filter(p -> p.getPrix() != null && p.getPrix().compareTo(prixMin) >= 0);
        }

        if (prixMax != null) {
            stream = stream.filter(p -> p.getPrix() != null && p.getPrix().compareTo(prixMax) <= 0);
        }

        if (stockMin != null) {
            stream = stream.filter(p -> p.getStock() != null && p.getStock() >= stockMin);
        }

        if (dateLimite != null) {
            stream = stream.filter(p -> p.getDateAjout() != null && !p.getDateAjout().isBefore(dateLimite));
        }

        List<ProduitResponse> results = stream.map(this::toResponse).collect(Collectors.toList());

        if (noteMin != null) {
            results = results.stream()
                    .filter(p -> p.getNoteMoyenne() != null && p.getNoteMoyenne() >= noteMin)
                    .collect(Collectors.toList());
        }

        if ("prixAsc".equalsIgnoreCase(tri)) {
            results.sort((p1, p2) -> p1.getPrix().compareTo(p2.getPrix()));
        } else if ("prixDesc".equalsIgnoreCase(tri)) {
            results.sort((p1, p2) -> p2.getPrix().compareTo(p1.getPrix()));
        }

        return sortCertifiedFirst(results);
    }

    @Transactional(readOnly = true)
    public ProduitResponse getParId(Long id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));
        return toResponse(produit);
    }

    @Transactional(readOnly = true)
    public List<ProduitResponse> getMesProduits(Long producteurId) {
        return produitRepository.findByProducteurId(producteurId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Version publique de getMesProduits : consultation du catalogue d'un
     * producteur depuis sa page profil, sans authentification requise. */
    @Transactional(readOnly = true)
    public List<ProduitResponse> getProduitsParProducteur(Long producteurId) {
        return produitRepository.findByProducteurId(producteurId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProduitResponse modifier(Long id, ProduitRequest request, Long producteurId) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        if (!produit.getProducteurId().equals(producteurId)) {
            throw new RuntimeException("Vous ne pouvez modifier que vos propres produits");
        }

        produit.setNom(request.getNom());
        produit.setDescription(request.getDescription());
        produit.setPrix(request.getPrix());
        produit.setStock(request.getStock());
        produit.setImageUrl(request.getImageUrl());
        produit.setLocalisation(request.getLocalisation());

        if (request.getCategorieId() != null) {
            Categorie categorie = categorieRepository.findById(request.getCategorieId())
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
            produit.setCategorie(categorie);
        } else {
            produit.setCategorie(null);
        }

        Produit updated = produitRepository.save(produit);
        return toResponse(updated);
    }

    @Transactional
    public void supprimer(Long id, Long producteurId) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable"));

        if (!produit.getProducteurId().equals(producteurId)) {
            throw new RuntimeException("Vous ne pouvez supprimer que vos propres produits");
        }

        produitRepository.delete(produit);
    }

    private List<ProduitResponse> sortCertifiedFirst(List<ProduitResponse> results) {
        return results.stream()
                .sorted(Comparator.comparing((ProduitResponse p) -> !Boolean.TRUE.equals(p.getCertifie())))
                .collect(Collectors.toList());
    }

    private ProduitResponse toResponse(Produit produit) {
        Long catId = null;
        String catNom = null;
        if (produit.getCategorie() != null) {
            catId = produit.getCategorie().getId();
            catNom = produit.getCategorie().getNom();
        }

        Double noteMoyenne = 0.0;
        Long nombreAvis = 0L;
        try {
            AvisStatsDTO stats = restTemplate.getForObject(
                    avisServiceUrl + "/api/avis/produit/" + produit.getId() + "/stats",
                    AvisStatsDTO.class);
            if (stats != null) {
                noteMoyenne = stats.getNoteMoyenne() != null ? stats.getNoteMoyenne() : 0.0;
                nombreAvis = stats.getNombreAvis() != null ? stats.getNombreAvis() : 0L;
            }
        } catch (Exception e) {
            // avis-service unavailable or no reviews yet — default to zero
        }

        Boolean certifie = false;
        try {
            Boolean result = restTemplate.getForObject(
                    certificationServiceUrl + "/api/certifications/statut-actif/" + produit.getProducteurId(),
                    Boolean.class);
            certifie = result != null ? result : false;
        } catch (Exception e) {
            // certification-service unavailable — default to false
        }

        String producteurNom = fetchProducteurNom(produit.getProducteurId());

        return new ProduitResponse(
                produit.getId(),
                produit.getNom(),
                produit.getDescription(),
                produit.getPrix(),
                produit.getStock(),
                produit.getImageUrl(),
                produit.getLocalisation(),
                produit.getDateAjout(),
                produit.getProducteurId(),
                producteurNom,
                catId,
                catNom,
                noteMoyenne,
                nombreAvis,
                certifie
        );
    }

    private String fetchProducteurNom(Long producteurId) {
        try {
            UtilisateurInfoDTO utilisateur = restTemplate.getForObject(
                    utilisateurServiceUrl + "/api/utilisateurs/" + producteurId,
                    UtilisateurInfoDTO.class);
            return (utilisateur != null && utilisateur.getNom() != null) ? utilisateur.getNom() : "Producteur inconnu";
        } catch (Exception e) {
            // utilisateur-service indisponible — on degrade sans bloquer l'affichage du produit
            return "Producteur inconnu";
        }
    }
}