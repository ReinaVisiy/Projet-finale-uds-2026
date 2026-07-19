// src/services/certificationMapping.js
//
// certification-service ne connaît que producteurId (pas de nom/email/
// téléphone : ces infos vivent dans utilisateur-service). Ce fichier
// centralise la conversion entre CertificationResponse (backend) + les
// infos du producteur déjà résolues, et le format attendu par
// VendorVerificationAdmin.

export const STATUT_BACKEND_TO_FRONTEND = {
  EN_ATTENTE: 'pending',
  APPROUVEE: 'approved',
  REJETEE: 'rejected',
};

export const TYPE_DOCUMENT_LABELS = {
  CARTE_IDENTITE: "Carte d'identité",
  PASSEPORT: 'Passeport',
  PERMIS_CONDUIRE: 'Permis de conduire',
  RECIPISSE: 'Récépissé',
};

export const MOYEN_PAIEMENT_LABELS = {
  MTN_MOMO: 'MTN Mobile Money',
  ORANGE_MONEY: 'Orange Money',
};

/**
 * Convertit une CertificationResponse (backend) + { prenom, nom, email,
 * telephone } du producteur (résolus via utilisateur-service) en objet
 * tel qu'attendu par VendorVerificationAdmin.
 */
export function mapCertificationPourAdmin(dto, producteurInfo = {}) {
  return {
    id: dto.id,
    producteurId: dto.producteurId,
    prenom: producteurInfo.prenom || `Producteur`,
    nom: producteurInfo.nom || `#${dto.producteurId}`,
    email: producteurInfo.email || '—',
    telephone: producteurInfo.telephone || '—',
    location: producteurInfo.adresse || null,
    typeDocument: dto.typeDocument,
    typeDocumentLabel: TYPE_DOCUMENT_LABELS[dto.typeDocument] || dto.typeDocument,
    idRecto: dto.idRecto,
    idVerso: dto.idVerso,
    photoUtilisateur: dto.photoUtilisateur,
    // Liste des documents réellement fournis (certains producteurs n'ont
    // pas forcément les 3 : ex. pas de photoUtilisateur), utilisée pour
    // le badge "X documents" côté AdminDashboard.
    documents: [dto.idRecto, dto.idVerso, dto.photoUtilisateur].filter(Boolean),
    dureeMois: dto.dureeMois,
    montant: dto.montant,
    moyenPaiement: dto.moyenPaiement,
    moyenPaiementLabel: MOYEN_PAIEMENT_LABELS[dto.moyenPaiement] || dto.moyenPaiement,
    numeroPaiement: dto.numeroPaiement,
    statutPaiement: dto.statutPaiement, // EN_ATTENTE | PAYE | NON_PAYE
    submittedAt: dto.dateDemande,
    status: STATUT_BACKEND_TO_FRONTEND[dto.statut] || 'pending',
    motifRejet: dto.motifRejet,
  };
}
