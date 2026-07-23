package com.agriconnect.utilisateur_service.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Envoi des emails transactionnels du compte utilisateur : confirmation
 * d'inscription (cf. UtilisateurService#createUtilisateur) et
 * reinitialisation de mot de passe (cf.
 * UtilisateurService#demanderReinitialisationMotDePasse).
 *
 * Volontairement silencieux en cas d'echec d'envoi (log + exception
 * dediee) : la creation de compte ou la demande de reinitialisation ne
 * doit pas planter avec une erreur 500 opaque si le serveur SMTP est
 * momentanement indisponible, mais l'appelant doit pouvoir le signaler
 * proprement a l'utilisateur (cf. GlobalExceptionHandler).
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String expediteur;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void envoyerCodeConfirmation(String destinataire, String nom, String code) {
        String sujet = "Confirmez votre adresse email - AgriConnect";
        String corps = "Bonjour " + nom + ",\n\n"
                + "Merci de vous être inscrit(e) sur AgriConnect. Pour activer votre compte, "
                + "veuillez entrer le code de confirmation suivant dans l'application :\n\n"
                + "    " + code + "\n\n"
                + "Ce code expire dans 24 heures. Si vous n'êtes pas à l'origine de cette "
                + "inscription, vous pouvez ignorer cet email.\n\n"
                + "L'équipe AgriConnect";
        envoyer(destinataire, sujet, corps);
    }

    public void envoyerCodeReinitialisation(String destinataire, String nom, String code) {
        String sujet = "Réinitialisation de votre mot de passe - AgriConnect";
        String corps = "Bonjour " + nom + ",\n\n"
                + "Vous avez demandé la réinitialisation de votre mot de passe. Voici votre "
                + "code de vérification :\n\n"
                + "    " + code + "\n\n"
                + "Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette "
                + "demande, vous pouvez ignorer cet email : votre mot de passe restera inchangé.\n\n"
                + "L'équipe AgriConnect";
        envoyer(destinataire, sujet, corps);
    }

    private void envoyer(String destinataire, String sujet, String corps) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(expediteur);
            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(corps, false);
            mailSender.send(message);
        } catch (MessagingException | org.springframework.mail.MailException e) {
            log.error("Echec de l'envoi d'email a {} : {}", destinataire, e.getMessage());
            throw new EmailEnvoiException(
                    "L'envoi de l'email a échoué. Vérifiez l'adresse saisie ou réessayez plus tard.");
        }
    }

    public static class EmailEnvoiException extends RuntimeException {
        public EmailEnvoiException(String message) {
            super(message);
        }
    }
}
