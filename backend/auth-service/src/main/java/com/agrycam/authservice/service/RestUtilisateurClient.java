package com.agrycam.authservice.service;

import com.agrycam.authservice.dto.IdentifiantsDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RestUtilisateurClient implements UtilisateurClient {

    private final RestTemplate restTemplate;

    @Value("${services.utilisateur-service.url}")
    private String utilisateurServiceUrl;

    // Doit correspondre a internal.service.secret dans utilisateur-service :
    // /api/utilisateurs/credentials exige ce secret car il expose le hash
    // du mot de passe (voir UtilisateurController.getCredentials).
    @Value("${internal.service.secret}")
    private String internalServiceSecret;

    public RestUtilisateurClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public IdentifiantsDTO getCredentialsByEmail(String email) {
        if (email == null) {
            return null;
        }

        String url = utilisateurServiceUrl + "/api/utilisateurs/credentials?email=" + email.trim().toLowerCase();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Secret", internalServiceSecret);
            HttpEntity<Void> requete = new HttpEntity<>(headers);

            CredentialsApiResponse reponse = restTemplate.exchange(
                    url, HttpMethod.GET, requete, CredentialsApiResponse.class
            ).getBody();

            if (reponse == null) {
                return null;
            }

            return new IdentifiantsDTO(
                    reponse.uid(),
                    reponse.email(),
                    reponse.motDePasse(),
                    reponse.roles(),
                    reponse.suspenduJusquau()
            );
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                return null;
            }
            throw e;
        }
    }

    private record CredentialsApiResponse(Long uid, String email, String motDePasse, List<String> roles, LocalDateTime suspenduJusquau) {}
}