package com.agriconnect.utilisateur_service.service;

import com.agriconnect.utilisateur_service.dto.ChangerMotDePasseRequest;
import com.agriconnect.utilisateur_service.dto.CredentialsResponse;
import com.agriconnect.utilisateur_service.dto.UpdateProfilRequest;
import com.agriconnect.utilisateur_service.dto.UtilisateurDTO;
import com.agriconnect.utilisateur_service.entity.Utilisateur;
import com.agriconnect.utilisateur_service.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UtilisateurDTO> getAllUtilisateurs() {
        return utilisateurRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public UtilisateurDTO getUtilisateurById(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));
        return toDTO(user);
    }

    public UtilisateurDTO createUtilisateur(Utilisateur utilisateur) {
        utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
        if (utilisateur.getPlan() == null || utilisateur.getPlan().isBlank()) {
            utilisateur.setPlan("gratuit");
        }
        utilisateurRepository.save(utilisateur);
        return toDTO(utilisateur);
    }

    public UtilisateurDTO updateProfil(Long id, UpdateProfilRequest request) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        user.setNom(request.getNom());
        user.setAdresse(request.getAdresse());
        user.setEmail(request.getEmail());
        if (request.getTelephone() != null) user.setTelephone(request.getTelephone());
        if (request.getPhoto() != null) user.setPhoto(request.getPhoto());
        if (request.getPlan() != null) user.setPlan(request.getPlan());

        utilisateurRepository.save(user);
        return toDTO(user);
    }

    /**
     * Change le mot de passe d'un utilisateur apres verification de
     * l'ancien mot de passe. Leve une RuntimeException si l'ancien mot
     * de passe ne correspond pas (traduite en 400/404 par le controller).
     */
    public void changerMotDePasse(Long id, ChangerMotDePasseRequest request) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        if (!passwordEncoder.matches(request.getAncienMotDePasse(), user.getMotDePasse())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect");
        }

        user.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateurRepository.save(user);
    }

    public void deleteUtilisateur(Long id) {
        utilisateurRepository.deleteById(id);
    }

    public List<UtilisateurDTO> rechercherUtilisateursParNom(String nom) {
        return utilisateurRepository.findByNomContainingIgnoreCase(nom)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public UtilisateurDTO creerAdministrateur(String nom, String email, String motDePasse) {
        Utilisateur admin = new Utilisateur();
        admin.setNom(nom);
        admin.setEmail(email);
        admin.setMotDePasse(passwordEncoder.encode(motDePasse));
        admin.setRole(Utilisateur.Role.ADMIN);
        utilisateurRepository.save(admin);
        return toDTO(admin);
    }

    public CredentialsResponse getCredentialsByEmail(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        return new CredentialsResponse(
                user.getId(),
                user.getEmail(),
                user.getMotDePasse(),
                List.of(user.getRole().name()),
                user.getSuspenduJusquau()
        );
    }

    /**
     * Suspend un compte pour un nombre de jours donné à partir de
     * maintenant (action admin), ou lève la suspension si jours est
     * null/0/négatif. Un compte suspendu ne peut plus se connecter tant
     * que la date n'est pas dépassée (vérifié par auth-service via
     * getCredentialsByEmail). Il n'y a pas de "blocage définitif"
     * séparé : pour un blocage quasi permanent, on choisit un grand
     * nombre de jours.
     */
    public UtilisateurDTO suspendreUtilisateur(Long id, Integer jours) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));
        if (jours == null || jours <= 0) {
            user.setSuspenduJusquau(null);
        } else {
            user.setSuspenduJusquau(LocalDateTime.now().plusDays(jours));
        }
        utilisateurRepository.save(user);
        return toDTO(user);
    }

    private UtilisateurDTO toDTO(Utilisateur user) {
        UtilisateurDTO dto = new UtilisateurDTO();
        dto.setId(user.getId());
        dto.setNom(user.getNom());
        dto.setEmail(user.getEmail());
        dto.setAdresse(user.getAdresse());
        dto.setRole(user.getRole().name());
        dto.setTelephone(user.getTelephone());
        dto.setPhoto(user.getPhoto());
        dto.setPlan(user.getPlan());
        dto.setSuspenduJusquau(user.getSuspenduJusquau());
        dto.setSuspendu(user.getSuspenduJusquau() != null && user.getSuspenduJusquau().isAfter(LocalDateTime.now()));
        return dto;
    }
}