package com.agriconnect.utilisateur_service.config;

import com.agriconnect.utilisateur_service.entity.Utilisateur;
import com.agriconnect.utilisateur_service.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Migration ponctuelle : la fonctionnalite de confirmation d'email est
 * ajoutee alors que des comptes existent deja en base. Sans ce runner,
 * la colonne emailConfirme=false par defaut bloquerait la connexion de
 * TOUS les comptes deja inscrits avant ce déploiement (cf.
 * AuthService#login).
 *
 * On distingue les "anciens" comptes (jamais concernes par le nouveau
 * flux, donc sans code de confirmation en attente) des inscriptions en
 * cours : seuls les comptes avec emailConfirme=false ET
 * codeConfirmationEmail=null sont marques confirmes automatiquement.
 * Un compte en cours d'inscription (code en attente, non expire ou non)
 * n'est pas touche et devra confirmer normalement.
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class ConfirmationEmailBackfill implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ConfirmationEmailBackfill.class);

    private final UtilisateurRepository utilisateurRepository;

    @Override
    public void run(String... args) {
        List<Utilisateur> anciensComptes = utilisateurRepository.findByEmailConfirmeFalseAndCodeConfirmationEmailIsNull();
        if (anciensComptes.isEmpty()) {
            return;
        }
        anciensComptes.forEach(u -> u.setEmailConfirme(true));
        utilisateurRepository.saveAll(anciensComptes);
        log.info("Migration confirmation email : {} compte(s) existant(s) marque(s) confirmes automatiquement.", anciensComptes.size());
    }
}
