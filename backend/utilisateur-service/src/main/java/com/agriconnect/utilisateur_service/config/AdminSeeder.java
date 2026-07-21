package com.agriconnect.utilisateur_service.config;

import com.agriconnect.utilisateur_service.entity.Utilisateur;
import com.agriconnect.utilisateur_service.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crée automatiquement un premier compte administrateur au démarrage de
 * l'application, s'il n'en existe encore aucun. Ceci résout le problème
 * de "l'œuf et la poule" : sans ce seeder, il n'existait aucun moyen de
 * créer le tout premier admin (le endpoint /admin/creer exige déjà d'être
 * authentifié).
 *
 * Le mot de passe est haché avec le même PasswordEncoder que le reste de
 * l'application et peut être changé ensuite via le endpoint existant de
 * changement de mot de passe.
 */
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    // Identifiants du premier admin. L'email sert d'identifiant de
    // connexion (voir auth-service) ; le mot de passe est haché avant
    // stockage et reste modifiable ensuite.
    private static final String ADMIN_NOM = "Reina Visiy";
    private static final String ADMIN_EMAIL = "reinavisiy@gmail.com";
    private static final String ADMIN_MOT_DE_PASSE = "Admin2026";

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (utilisateurRepository.countByRole(Utilisateur.Role.ADMIN) > 0) {
            return;
        }

        Utilisateur admin = new Utilisateur();
        admin.setNom(ADMIN_NOM);
        admin.setEmail(ADMIN_EMAIL);
        admin.setMotDePasse(passwordEncoder.encode(ADMIN_MOT_DE_PASSE));
        admin.setRole(Utilisateur.Role.ADMIN);
        utilisateurRepository.save(admin);

        log.info("Compte administrateur initial créé automatiquement (email: {})", ADMIN_EMAIL);
    }
}
