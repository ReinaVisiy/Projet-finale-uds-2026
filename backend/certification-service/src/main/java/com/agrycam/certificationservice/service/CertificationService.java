package com.agrycam.certificationservice.service;

import com.agrycam.certificationservice.dto.CertificationRequest;
import com.agrycam.certificationservice.dto.CertificationResponse;
import com.agrycam.certificationservice.dto.CertificationReviewRequest;
import com.agrycam.certificationservice.dto.PaymentConfirmationRequest;
import com.agrycam.certificationservice.entity.Certification;
import com.agrycam.certificationservice.entity.StatutCertification;
import com.agrycam.certificationservice.entity.StatutPaiement;
import com.agrycam.certificationservice.repository.CertificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CertificationService {

    private final CertificationRepository certificationRepository;

    public CertificationService(CertificationRepository certificationRepository) {
        this.certificationRepository = certificationRepository;
    }

    @Transactional
    public CertificationResponse soumettre(CertificationRequest request, Long producteurId) {
        Certification certification = new Certification();
        certification.setProducteurId(producteurId);
        certification.setTypeDocument(request.getTypeDocument());
        certification.setIdRecto(request.getIdRecto());
        certification.setIdVerso(request.getIdVerso());
        certification.setPhotoUtilisateur(request.getPhotoUtilisateur());
        certification.setDureeMois(request.getDureeMois());
        certification.setMontant(request.getMontant());
        certification.setMoyenPaiement(request.getMoyenPaiement());
        certification.setNumeroPaiement(request.getNumeroPaiement());
        certification.setStatut(StatutCertification.EN_ATTENTE);
        certification.setStatutPaiement(StatutPaiement.EN_ATTENTE);

        Certification saved = certificationRepository.save(certification);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public long compterProducteursVerifies() {
        return certificationRepository.countProducteursDistinctsByStatut(StatutCertification.APPROUVEE);
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getMesCertifications(Long producteurId) {
        List<Certification> list = certificationRepository.findByProducteurId(producteurId);
        return list.stream()
                .sorted((c1, c2) -> {
                    if (c1.getDateDemande() == null && c2.getDateDemande() == null) return 0;
                    if (c1.getDateDemande() == null) return 1;
                    if (c2.getDateDemande() == null) return -1;
                    return c2.getDateDemande().compareTo(c1.getDateDemande()); // Tri decroissant
                })
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CertificationResponse getParId(Long id) {
        Certification cert = certificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certification introuvable"));
        return toResponse(cert);
    }

    @Transactional(readOnly = true)
    public List<CertificationResponse> getEnAttente() {
        List<Certification> list = certificationRepository.findByStatut(StatutCertification.EN_ATTENTE);
        return list.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Contrairement à getEnAttente(), renvoie TOUTES les certifications
    // (en attente, approuvées, rejetées), triées des plus récentes aux
    // plus anciennes. Nécessaire pour que les onglets "Approuvées" /
    // "Rejetées" du tableau de bord admin restent alimentés après une
    // décision (auparavant, la certification disparaissait purement et
    // simplement dès qu'elle quittait le statut EN_ATTENTE).
    @Transactional(readOnly = true)
    public List<CertificationResponse> getToutes() {
        List<Certification> list = certificationRepository.findAll();
        return list.stream()
                .sorted((a, b) -> b.getDateDemande().compareTo(a.getDateDemande()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CertificationResponse confirmerPaiement(Long id, PaymentConfirmationRequest request) {
        Certification certification = certificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certification introuvable"));

        if (Boolean.TRUE.equals(request.getPaye())) {
            certification.setStatutPaiement(StatutPaiement.PAYE);
        } else {
            certification.setStatutPaiement(StatutPaiement.NON_PAYE);
        }

        Certification saved = certificationRepository.save(certification);
        return toResponse(saved);
    }

    @Transactional
    public CertificationResponse reviser(Long id, CertificationReviewRequest request, Long adminId) {
        Certification certification = certificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certification introuvable"));

        if (certification.getStatut() != StatutCertification.EN_ATTENTE) {
            throw new RuntimeException("Cette demande a déjà été traitée");
        }

        if (Boolean.TRUE.equals(request.getApprouve())) {
            if (certification.getStatutPaiement() != StatutPaiement.PAYE) {
                throw new RuntimeException("Paiement non confirmé");
            }
            certification.setStatut(StatutCertification.APPROUVEE);
            LocalDateTime now = LocalDateTime.now();
            certification.setDateApprobation(now);
            certification.setDateExpiration(now.plusMonths(certification.getDureeMois()));
            certification.setAdminReviseurId(adminId);
        } else {
            certification.setStatut(StatutCertification.REJETEE);
            certification.setMotifRejet(request.getMotifRejet());
            certification.setAdminReviseurId(adminId);
        }

        Certification saved = certificationRepository.save(certification);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public boolean estCertifieActif(Long producteurId) {
        Optional<Certification> optCert = certificationRepository
                .findFirstByProducteurIdAndStatutOrderByDateApprobationDesc(producteurId, StatutCertification.APPROUVEE);

        if (optCert.isEmpty()) {
            return false;
        }

        Certification cert = optCert.get();
        return cert.getStatut() == StatutCertification.APPROUVEE 
                && cert.getDateExpiration() != null 
                && cert.getDateExpiration().isAfter(LocalDateTime.now());
    }

    private CertificationResponse toResponse(Certification certification) {
        if (certification == null) {
            return null;
        }
        return new CertificationResponse(
                certification.getId(),
                certification.getProducteurId(),
                certification.getTypeDocument(),
                certification.getIdRecto(),
                certification.getIdVerso(),
                certification.getPhotoUtilisateur(),
                certification.getDureeMois(),
                certification.getMontant(),
                certification.getMoyenPaiement(),
                certification.getNumeroPaiement(),
                certification.getStatutPaiement(),
                certification.getStatut(),
                certification.getDateDemande(),
                certification.getDateApprobation(),
                certification.getDateExpiration(),
                certification.getAdminReviseurId(),
                certification.getMotifRejet()
        );
    }
}
