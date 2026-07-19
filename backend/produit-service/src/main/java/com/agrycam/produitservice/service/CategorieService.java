package com.agrycam.produitservice.service;

import com.agrycam.produitservice.dto.CategorieRequest;
import com.agrycam.produitservice.dto.CategorieResponse;
import com.agrycam.produitservice.entity.Categorie;
import com.agrycam.produitservice.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategorieService {

    private final CategorieRepository categorieRepository;

    @Transactional(readOnly = true)
    public List<CategorieResponse> getTous() {
        return categorieRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategorieResponse getParId(Long id) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        return toResponse(categorie);
    }

    @Transactional
    public CategorieResponse creer(CategorieRequest request) {
        Categorie categorie = new Categorie();
        categorie.setNom(request.getNom());
        Categorie saved = categorieRepository.save(categorie);
        return toResponse(saved);
    }

    @Transactional
    public CategorieResponse modifier(Long id, CategorieRequest request) {
        Categorie categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        categorie.setNom(request.getNom());
        Categorie updated = categorieRepository.save(categorie);
        return toResponse(updated);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!categorieRepository.existsById(id)) {
            throw new RuntimeException("Catégorie introuvable");
        }
        categorieRepository.deleteById(id);
    }

    private CategorieResponse toResponse(Categorie categorie) {
        return new CategorieResponse(categorie.getId(), categorie.getNom());
    }
}
