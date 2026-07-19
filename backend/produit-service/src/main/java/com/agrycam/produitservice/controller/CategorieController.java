package com.agrycam.produitservice.controller;

import com.agrycam.produitservice.dto.CategorieRequest;
import com.agrycam.produitservice.dto.CategorieResponse;
import com.agrycam.produitservice.service.CategorieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CategorieController {

    private final CategorieService categorieService;

    @GetMapping
    public ResponseEntity<List<CategorieResponse>> getTous() {
        return ResponseEntity.ok(categorieService.getTous());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategorieResponse> getParId(@PathVariable Long id) {
        return ResponseEntity.ok(categorieService.getParId(id));
    }

    @PostMapping
    public ResponseEntity<CategorieResponse> creer(@RequestBody CategorieRequest request) {
        CategorieResponse response = categorieService.creer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategorieResponse> modifier(
            @PathVariable Long id,
            @RequestBody CategorieRequest request) {
        CategorieResponse response = categorieService.modifier(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        categorieService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
