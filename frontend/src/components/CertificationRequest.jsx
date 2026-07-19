import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, X, Shield, Clock, AlertCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import { certificationApi } from '../services/api';

// Durées proposées et montant correspondant (FCFA). Le backend accepte
// n'importe quel montant envoyé par le client (pas de grille tarifaire
// côté serveur), donc cette grille reste indicative côté frontend.
const DUREES = [
  { mois: 3, montant: 2000 },
  { mois: 6, montant: 3500 },
  { mois: 12, montant: 6000 },
];

const TYPES_DOCUMENT = [
  { value: 'CARTE_IDENTITE', label: "Carte d'identité" },
  { value: 'PASSEPORT', label: 'Passeport' },
  { value: 'PERMIS_CONDUIRE', label: 'Permis de conduire' },
  { value: 'RECIPISSE', label: 'Récépissé' },
];

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (ev) => resolve(ev.target.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function CertificationRequest({ onBack }) {
  // certification: dernière demande du producteur (ou null si aucune)
  const [certification, setCertification] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [typeDocument, setTypeDocument] = useState('CARTE_IDENTITE');
  const [idRecto, setIdRecto] = useState(null);
  const [idVerso, setIdVerso] = useState(null);
  const [photoUtilisateur, setPhotoUtilisateur] = useState(null);
  const [dureeMois, setDureeMois] = useState(DUREES[0].mois);
  const [moyenPaiement, setMoyenPaiement] = useState('MTN_MOMO');
  const [numeroPaiement, setNumeroPaiement] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rectoRef = useRef(null);
  const versoRef = useRef(null);
  const photoRef = useRef(null);

  useEffect(() => {
    Promise.all([certificationApi.getMesCertifications(), certificationApi.getPaymentInformation()])
      .then(([mesCertifications, infos]) => {
        // On affiche la demande la plus récente s'il y en a une.
        const derniere = [...mesCertifications].sort(
          (a, b) => new Date(b.dateDemande) - new Date(a.dateDemande)
        )[0];
        setCertification(derniere || null);
        setPaymentInfo(infos);
      })
      .catch((err) => setError(err.message || 'Impossible de charger votre statut de certification'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = (setter) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setter(await readAsDataUrl(file));
  };

  const montantSelectionne = DUREES.find(d => d.mois === dureeMois)?.montant || 0;
  const numeroReception = paymentInfo.find(p => p.operateur === moyenPaiement)?.numeroPaiement;

  const handleSubmit = () => {
    if (!idRecto || !idVerso || !photoUtilisateur || !numeroPaiement.trim()) {
      setError("Veuillez fournir le recto/verso de votre pièce, votre photo, et le numéro utilisé pour le paiement.");
      return;
    }
    setError('');
    setSubmitting(true);
    certificationApi.soumettreCertification({
      typeDocument,
      idRecto,
      idVerso,
      photoUtilisateur,
      dureeMois,
      montant: montantSelectionne,
      moyenPaiement,
      numeroPaiement: numeroPaiement.trim(),
    })
      .then((response) => setCertification(response))
      .catch((err) => setError(err.message || "Échec de l'envoi de la demande de certification"))
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.statusCard}>
          <p style={styles.statusText}>Chargement de votre statut de certification...</p>
        </div>
      </div>
    );
  }

  // ===== STATUT : EN ATTENTE =====
  if (certification && certification.statut === 'EN_ATTENTE') {
    return (
      <div style={styles.wrapper}>
        <div style={styles.statusCard}>
          <div style={styles.statusIconWrap}>
            <Clock size={48} color="#f5b041" />
          </div>
          <h2 style={styles.statusTitle}>Demande en cours d'examen ⏳</h2>
          <p style={styles.statusText}>
            Votre demande de certification a été envoyée avec succès.<br />
            Notre équipe l'examine dès que le paiement est confirmé.
          </p>
          <div style={styles.statusDetails}>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>Durée demandée</span>
              <span style={styles.statusValue}>{certification.dureeMois} mois</span>
            </div>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>Montant</span>
              <span style={styles.statusValue}>{certification.montant} FCFA</span>
            </div>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>Statut du paiement</span>
              <span style={styles.statusValue}>
                {certification.statutPaiement === 'PAYE' ? 'Payé ✅' : certification.statutPaiement === 'NON_PAYE' ? 'Non payé ❌' : 'En attente de confirmation'}
              </span>
            </div>
          </div>
          <button style={styles.backToStatusBtn} onClick={onBack}>Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  // ===== STATUT : REJETÉE =====
  if (certification && certification.statut === 'REJETEE') {
    return (
      <div style={styles.wrapper}>
        <div style={styles.statusCard}>
          <div style={{ ...styles.statusIconWrap, backgroundColor: '#fdecea' }}>
            <XCircle size={48} color="#c0392b" />
          </div>
          <h2 style={styles.statusTitle}>Demande rejetée</h2>
          <p style={styles.statusText}>
            {certification.motifRejet || "Votre demande de certification n'a pas été retenue."}
          </p>
          <button style={styles.submitBtn} onClick={() => setCertification(null)}>
            <Shield size={18} /> Soumettre une nouvelle demande
          </button>
        </div>
      </div>
    );
  }

  // ===== STATUT : APPROUVÉE =====
  if (certification && certification.statut === 'APPROUVEE' && certification.estActive) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.statusCard}>
          <div style={{ ...styles.statusIconWrap, backgroundColor: '#e9f5ee' }}>
            <Shield size={48} color="#2d6a4f" />
          </div>
          <h2 style={styles.statusTitle}>Vous êtes certifié ! ✅</h2>
          <p style={styles.statusText}>
            Le badge <strong>✅ Certifié</strong> apparaît désormais sur tous vos produits, jusqu'au{' '}
            <strong>{certification.dateExpiration ? new Date(certification.dateExpiration).toLocaleDateString('fr-FR') : ''}</strong>.
          </p>
          <button style={styles.backToStatusBtn} onClick={onBack}>Retour au tableau de bord</button>
        </div>
      </div>
    );
  }

  // ===== FORMULAIRE (aucune demande, ou certification expirée) =====
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>

        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={18} /> Retour
          </button>
          <div style={styles.headerBadge}>
            <Shield size={28} color="#ffffff" />
          </div>
          <h1 style={styles.title}>Demande de certification</h1>
          <p style={styles.subtitle}>
            Obtenez le badge <strong>✅ Certifié</strong> pour renforcer la confiance de vos clients
          </p>
        </div>

        <div style={styles.grid}>

          <div style={styles.formCard}>

            <h3 style={styles.sectionTitle}>Pièce d'identité</h3>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Type de document *</label>
              <select style={styles.input} value={typeDocument} onChange={(e) => setTypeDocument(e.target.value)}>
                {TYPES_DOCUMENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div style={styles.row2}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Recto *</label>
                <div style={styles.uploadZone} onClick={() => rectoRef.current.click()}>
                  <input ref={rectoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload(setIdRecto)} />
                  {idRecto ? <img src={idRecto} alt="Recto" style={styles.previewImg} /> : <ImageIcon size={24} color="#2d6a4f" />}
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Verso *</label>
                <div style={styles.uploadZone} onClick={() => versoRef.current.click()}>
                  <input ref={versoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload(setIdVerso)} />
                  {idVerso ? <img src={idVerso} alt="Verso" style={styles.previewImg} /> : <ImageIcon size={24} color="#2d6a4f" />}
                </div>
              </div>
            </div>

            <h3 style={styles.sectionTitle}>Votre photo *</h3>
            <p style={styles.hint}>Une photo récente de vous, pour vérifier votre identité.</p>
            <div style={styles.uploadZone} onClick={() => photoRef.current.click()}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload(setPhotoUtilisateur)} />
              {photoUtilisateur ? <img src={photoUtilisateur} alt="Vous" style={styles.previewImg} /> : <ImageIcon size={24} color="#2d6a4f" />}
            </div>

            <h3 style={styles.sectionTitle}>Durée & paiement</h3>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Durée de la certification *</label>
              <div style={styles.dureeRow}>
                {DUREES.map(d => (
                  <button
                    key={d.mois}
                    type="button"
                    onClick={() => setDureeMois(d.mois)}
                    style={{ ...styles.dureeBtn, ...(dureeMois === d.mois ? styles.dureeBtnActive : {}) }}
                  >
                    {d.mois} mois<br /><strong>{d.montant} FCFA</strong>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Moyen de paiement *</label>
              <select style={styles.input} value={moyenPaiement} onChange={(e) => setMoyenPaiement(e.target.value)}>
                <option value="MTN_MOMO">MTN Mobile Money</option>
                <option value="ORANGE_MONEY">Orange Money</option>
              </select>
            </div>

            {numeroReception && (
              <div style={styles.infoBox}>
                <AlertCircle size={16} color="#e07a5f" />
                <span style={styles.infoText}>
                  Effectuez le paiement de <strong>{montantSelectionne} FCFA</strong> au numéro <strong>{numeroReception}</strong>, puis indiquez ci-dessous le numéro utilisé.
                </span>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Votre numéro de paiement *</label>
              <input
                type="tel"
                placeholder="Ex: 6XX XXX XXX"
                style={styles.input}
                value={numeroPaiement}
                onChange={(e) => setNumeroPaiement(e.target.value)}
              />
            </div>

            {error && <p style={styles.errorText}>{error}</p>}

            <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
              <Shield size={18} /> {submitting ? 'Envoi en cours...' : 'Envoyer la demande de certification'}
            </button>
          </div>

          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>Pourquoi se certifier ?</h3>
            <div style={styles.benefitList}>
              <div style={styles.benefitItem}>
                <CheckCircle size={18} color="#2d6a4f" />
                <span>Badge <strong>✅ Certifié</strong> visible sur tous vos produits</span>
              </div>
              <div style={styles.benefitItem}>
                <CheckCircle size={18} color="#2d6a4f" />
                <span>Confiance accrue des acheteurs</span>
              </div>
              <div style={styles.benefitItem}>
                <CheckCircle size={18} color="#2d6a4f" />
                <span>Meilleur classement dans les résultats</span>
              </div>
            </div>
            <div style={styles.infoBox}>
              <AlertCircle size={16} color="#e07a5f" />
              <span style={styles.infoText}>
                Votre demande est examinée par un administrateur après confirmation du paiement.
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' },

  header: { textAlign: 'center', padding: '40px 0', position: 'relative' },
  backBtn: { position: 'absolute', left: 0, top: '40px', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#212529', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  headerBadge: { width: '64px', height: '64px', backgroundColor: '#2d6a4f', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1b4d3e', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#6c757d', margin: 0, fontWeight: '500' },

  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', alignItems: 'start' },

  formCard: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #e9ecef', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' },
  sectionTitle: { fontSize: '16px', fontWeight: '800', color: '#212529', margin: '24px 0 16px 0' },
  hint: { fontSize: '13px', color: '#6c757d', margin: '0 0 12px 0' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#343a40' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #dee2e6', fontSize: '14px', backgroundColor: '#f8f9fa', outline: 'none', boxSizing: 'border-box' },

  uploadZone: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px', minHeight: '100px', border: '2px dashed #b7e4c7', borderRadius: '16px', backgroundColor: '#f0f7f4', cursor: 'pointer', marginBottom: '4px', overflow: 'hidden' },
  previewImg: { width: '100%', height: '80px', objectFit: 'cover', borderRadius: '10px' },

  dureeRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  dureeBtn: { padding: '12px 8px', borderRadius: '12px', border: '1.5px solid #dee2e6', backgroundColor: '#f8f9fa', fontSize: '12px', color: '#495057', cursor: 'pointer', textAlign: 'center', fontWeight: '600' },
  dureeBtnActive: { border: '1.5px solid #2d6a4f', backgroundColor: '#e9f5ee', color: '#1b4d3e' },

  submitBtn: { width: '100%', padding: '16px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '24px', boxShadow: '0 8px 24px rgba(45,106,79,0.3)' },
  errorText: { color: '#c0392b', fontSize: '13px', fontWeight: '700', margin: '8px 0 0 0' },

  sideCard: { backgroundColor: '#e9f5ee', borderRadius: '24px', padding: '28px', border: '1px solid #b7e4c7' },
  sideTitle: { fontSize: '16px', fontWeight: '800', color: '#1b4d3e', margin: '0 0 20px 0' },
  benefitList: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' },
  benefitItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#212529', lineHeight: '1.5' },
  infoBox: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f5d4c8', marginBottom: '16px' },
  infoText: { fontSize: '12px', color: '#495057', lineHeight: '1.5' },

  statusCard: { maxWidth: '500px', margin: '80px auto', backgroundColor: '#ffffff', borderRadius: '28px', padding: '48px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.08)' },
  statusIconWrap: { width: '96px', height: '96px', backgroundColor: '#fff8e8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' },
  statusTitle: { fontSize: '24px', fontWeight: '900', color: '#212529', margin: '0 0 16px 0' },
  statusText: { fontSize: '15px', color: '#6c757d', lineHeight: '1.6', margin: '0 0 24px 0' },
  statusDetails: { backgroundColor: '#f8f9fa', borderRadius: '16px', padding: '16px', marginBottom: '24px', textAlign: 'left' },
  statusRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0' },
  statusLabel: { fontSize: '13px', color: '#6c757d', fontWeight: '600' },
  statusValue: { fontSize: '13px', color: '#212529', fontWeight: '700' },
  backToStatusBtn: { padding: '14px 32px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
};
