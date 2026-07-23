package com.agriconnect.utilisateur_service.service;

import com.agriconnect.utilisateur_service.dto.ChangerMotDePasseRequest;
import com.agriconnect.utilisateur_service.dto.CredentialsResponse;
import com.agriconnect.utilisateur_service.dto.UpdateProfilRequest;
import com.agriconnect.utilisateur_service.dto.UtilisateurDTO;
import com.agriconnect.utilisateur_service.entity.Utilisateur;
import com.agriconnect.utilisateur_service.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.InitialDirContext;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Hashtable;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private static final Logger log = LoggerFactory.getLogger(UtilisateurService.class);

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    public List<UtilisateurDTO> getAllUtilisateurs() {
        return utilisateurRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Stat publique pour la page d'accueil : uniquement des totaux, jamais
    // la liste des comptes (noms, emails...) elle-même.
    public java.util.Map<String, Long> getStatsPubliques() {
        return java.util.Map.of(
                "totalUtilisateurs", utilisateurRepository.count(),
                "totalProducteurs", utilisateurRepository.countByRole(Utilisateur.Role.PRODUCTEUR)
        );
    }

    public UtilisateurDTO getUtilisateurById(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));
        return toDTO(user);
    }

    /**
     * Cree un compte : email non deja utilise et domaine capable de
     * recevoir du courrier (verification DNS/MX, cf. validerDomaineEmail).
     * Le compte est cree non confirme (emailConfirme=false) et un code a
     * usage unique est envoye par email ; auth-service refuse la connexion
     * tant que confirmerEmail(...) n'a pas ete appele avec ce code (cf.
     * AuthService#login cote auth-service). Ceci remplace l'ancien
     * comportement qui acceptait n'importe quelle adresse, valide ou non.
     */
    @org.springframework.transaction.annotation.Transactional
    public UtilisateurDTO createUtilisateur(Utilisateur utilisateur) {
        if (utilisateur.getEmail() != null) {
            utilisateur.setEmail(utilisateur.getEmail().trim().toLowerCase());
        }
        if (utilisateurRepository.existsByEmail(utilisateur.getEmail())) {
            throw new IllegalArgumentException("Un compte existe deja avec cet email.");
        }
        validerDomaineEmail(utilisateur.getEmail());

        utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
        if (utilisateur.getPlan() == null || utilisateur.getPlan().isBlank()) {
            utilisateur.setPlan("gratuit");
        }

        String code = genererCode();
        utilisateur.setEmailConfirme(false);
        utilisateur.setCodeConfirmationEmail(code);
        utilisateur.setExpirationCodeConfirmation(LocalDateTime.now().plusHours(24));

        utilisateurRepository.save(utilisateur);
        mailService.envoyerCodeConfirmation(utilisateur.getEmail(), utilisateur.getNom(), code);
        return toDTO(utilisateur);
    }

    /**
     * Valide le code de confirmation recu par email a l'inscription et
     * active le compte (emailConfirme=true). Leve une IllegalArgumentException
     * (400) si le code est incorrect ou expire, et une RuntimeException
     * (404) si l'email ne correspond a aucun compte.
     */
    @org.springframework.transaction.annotation.Transactional
    public void confirmerEmail(String email, String code) {
        Utilisateur user = utilisateurRepository.findByEmail(normaliserEmail(email))
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        if (user.isEmailConfirme()) {
            return; // deja confirme : idempotent, pas d'erreur si on rejoue l'appel
        }
        if (user.getCodeConfirmationEmail() == null
                || !user.getCodeConfirmationEmail().equals(code)
                || user.getExpirationCodeConfirmation() == null
                || user.getExpirationCodeConfirmation().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Code de confirmation invalide ou expire.");
        }

        user.setEmailConfirme(true);
        user.setCodeConfirmationEmail(null);
        user.setExpirationCodeConfirmation(null);
        utilisateurRepository.save(user);
    }

    /**
     * Renvoie un nouveau code de confirmation (ex : l'utilisateur n'a pas
     * recu le premier email ou le code a expire).
     */
    @org.springframework.transaction.annotation.Transactional
    public void renvoyerCodeConfirmation(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(normaliserEmail(email))
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));
        if (user.isEmailConfirme()) {
            throw new IllegalArgumentException("Cet email est deja confirme.");
        }
        String code = genererCode();
        user.setCodeConfirmationEmail(code);
        user.setExpirationCodeConfirmation(LocalDateTime.now().plusHours(24));
        utilisateurRepository.save(user);
        mailService.envoyerCodeConfirmation(user.getEmail(), user.getNom(), code);
    }

    /**
     * Etape 1 du "mot de passe oublie" : genere un code de verification
     * (valable 15 min) et l'envoie par email. Leve une RuntimeException
     * (404) si aucun compte ne correspond a cet email.
     */
    @org.springframework.transaction.annotation.Transactional
    public void demanderReinitialisationMotDePasse(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(normaliserEmail(email))
                .orElseThrow(() -> new RuntimeException("Aucun compte associe a cet email."));

        String code = genererCode();
        user.setCodeReinitialisationMdp(code);
        user.setExpirationCodeReinitialisation(LocalDateTime.now().plusMinutes(15));
        utilisateurRepository.save(user);
        mailService.envoyerCodeReinitialisation(user.getEmail(), user.getNom(), code);
    }

    /**
     * Etape 2 : verifie le code sans encore modifier le mot de passe
     * (permet au frontend de passer a l'ecran "nouveau mot de passe"
     * seulement si le code saisi est correct).
     */
    public void verifierCodeReinitialisation(String email, String code) {
        Utilisateur user = utilisateurRepository.findByEmail(normaliserEmail(email))
                .orElseThrow(() -> new RuntimeException("Aucun compte associe a cet email."));
        validerCodeReinitialisation(user, code);
    }

    /**
     * Etape 3 : revalide le code (defense en profondeur si l'etape 2 a
     * ete contournee) puis applique le nouveau mot de passe et invalide
     * le code pour empecher sa reutilisation.
     */
    @org.springframework.transaction.annotation.Transactional
    public void reinitialiserMotDePasse(String email, String code, String nouveauMotDePasse) {
        Utilisateur user = utilisateurRepository.findByEmail(normaliserEmail(email))
                .orElseThrow(() -> new RuntimeException("Aucun compte associe a cet email."));
        validerCodeReinitialisation(user, code);

        user.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        user.setCodeReinitialisationMdp(null);
        user.setExpirationCodeReinitialisation(null);
        utilisateurRepository.save(user);
    }

    private void validerCodeReinitialisation(Utilisateur user, String code) {
        if (user.getCodeReinitialisationMdp() == null
                || !user.getCodeReinitialisationMdp().equals(code)
                || user.getExpirationCodeReinitialisation() == null
                || user.getExpirationCodeReinitialisation().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Code de verification invalide ou expire.");
        }
    }

    private String normaliserEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String genererCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    /**
     * Verifie que le domaine de l'email peut recevoir du courrier (un
     * enregistrement MX, ou a defaut un enregistrement A/AAAA) avant de
     * creer le compte. Ne verifie pas l'existence de la boite mail
     * elle-meme (impossible a garantir de maniere fiable sans provoquer
     * un envoi reel, cf. confirmerEmail qui s'en charge en pratique :
     * une adresse inexistante sur un domaine par ailleurs valide ne
     * confirmera simplement jamais son compte).
     */
    private void validerDomaineEmail(String email) {
        if (email == null || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Cette adresse email n'existe pas.");
        }
        String domaine = email.substring(email.indexOf('@') + 1);
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            // Point explicitement vers des serveurs DNS publics : le
            // provider JNDI ne detecte pas toujours correctement le
            // resolveur DNS configure au niveau du systeme d'exploitation
            // (notamment sous Windows), ce qui provoquait des echecs
            // "DNS error" meme pour des domaines parfaitement valides
            // (ex. gmail.com).
            env.put("java.naming.provider.url", "dns://8.8.8.8 dns://1.1.1.1");
            env.put("com.sun.jndi.dns.timeout.initial", "3000");
            env.put("com.sun.jndi.dns.timeout.retries", "2");
            InitialDirContext ictx = new InitialDirContext(env);

            Attribute mx = ictx.getAttributes(domaine, new String[]{"MX"}).get("MX");
            if (mx != null && mx.size() > 0) {
                return;
            }
            Attribute a = ictx.getAttributes(domaine, new String[]{"A"}).get("A");
            if (a == null || a.size() == 0) {
                throw new IllegalArgumentException("Cette adresse email n'existe pas.");
            }
        } catch (NamingException e) {
            log.warn("Domaine email invalide ou injoignable ({}) : {}", domaine, e.getMessage());
            throw new IllegalArgumentException("Cette adresse email n'existe pas.");
        }
    }

    public UtilisateurDTO updateProfil(Long id, UpdateProfilRequest request) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        user.setNom(request.getNom());
        user.setAdresse(request.getAdresse());
        user.setVille(request.getVille());
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
        if (utilisateurRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Un compte existe deja avec cet email.");
        }
        Utilisateur admin = new Utilisateur();
        admin.setNom(nom);
        admin.setEmail(email);
        admin.setMotDePasse(passwordEncoder.encode(motDePasse));
        admin.setRole(Utilisateur.Role.ADMIN);
        admin.setEmailConfirme(true);
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
                user.getSuspenduJusquau(),
                user.isEmailConfirme()
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
        dto.setVille(user.getVille());
        dto.setRole(user.getRole().name());
        dto.setTelephone(user.getTelephone());
        dto.setPhoto(user.getPhoto());
        dto.setPlan(user.getPlan());
        dto.setSuspenduJusquau(user.getSuspenduJusquau());
        dto.setSuspendu(user.getSuspenduJusquau() != null && user.getSuspenduJusquau().isAfter(LocalDateTime.now()));
        dto.setEmailConfirme(user.isEmailConfirme());
        return dto;
    }
}