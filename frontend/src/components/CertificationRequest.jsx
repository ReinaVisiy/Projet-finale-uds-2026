import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Shield, Clock, AlertCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import { certificationApi } from '../services/api';
import useIsMobile from '../hooks/useIsMobile';

// Durées proposées et montant correspondant (FCFA). Le backend accepte
// n'importe quel montant envoyé par le client (pas de grille tarifaire
// côté serveur), donc cette grille reste indicative côté frontend.
const DUREES = [
  { mois: 3, montant: 2000 },
  { mois: 6, montant: 3500 },
  { mois: 12, montant: 6000 },
];

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (ev) => resolve(ev.target.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function CertificationRequest({ onBack }) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile(768);
  const TYPES_DOCUMENT = ['CARTE_IDENTITE', 'PASSEPORT', 'PERMIS_CONDUIRE', 'RECIPISSE'].map((value) => ({
    value,
    label: t(`certificationRequest.docTypes.${value}`),
  }));
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
      .catch((err) => setError(err.message || t('certificationRequest.loadStatusError')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleUpload = (setter) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setter(await readAsDataUrl(file));
  };

  const montantSelectionne = DUREES.find(d => d.mois === dureeMois)?.montant || 0;
  const numeroReception = paymentInfo.find(p => p.operateur === moyenPaiement)?.numeroPaiement;

  const handleSubmit = () => {
    if (!idRecto || !idVerso || !photoUtilisateur || !numeroPaiement.trim()) {
      setError(t('certificationRequest.submitMissingFields'));
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
      .catch((err) => setError(err.message || t('certificationRequest.submitFailed')))
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.statusCard}>
          <p style={styles.statusText}>{t('certificationRequest.loadingStatus')}</p>
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
          <h2 style={styles.statusTitle}>{t('certificationRequest.pendingTitle')}</h2>
          <p style={styles.statusText}>
            {t('certificationRequest.pendingText1')}<br />
            {t('certificationRequest.pendingText2')}
          </p>
          <div style={styles.statusDetails}>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>{t('certificationRequest.requestedDuration')}</span>
              <span style={styles.statusValue}>{t('certificationRequest.durationMonths', { count: certification.dureeMois })}</span>
            </div>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>{t('certificationRequest.amount')}</span>
              <span style={styles.statusValue}>{certification.montant} FCFA</span>
            </div>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>{t('certificationRequest.paymentStatus')}</span>
              <span style={styles.statusValue}>
                {certification.statutPaiement === 'PAYE' ? t('certificationRequest.paid') : certification.statutPaiement === 'NON_PAYE' ? t('certificationRequest.unpaid') : t('certificationRequest.awaitingConfirmation')}
              </span>
            </div>
          </div>
          <button style={styles.backToStatusBtn} onClick={onBack}>{t('certificationRequest.backToDashboard')}</button>
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
          <h2 style={styles.statusTitle}>{t('certificationRequest.rejectedTitle')}</h2>
          <p style={styles.statusText}>
            {certification.motifRejet || t('certificationRequest.rejectedDefault')}
          </p>
          <button style={styles.submitBtn} onClick={() => setCertification(null)}>
            <Shield size={18} /> {t('certificationRequest.submitNew')}
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
          <h2 style={styles.statusTitle}>{t('certificationRequest.certifiedTitle')}</h2>
          <p style={styles.statusText}>
            {t('certificationRequest.certifiedText')}{' '}
            <strong>{certification.dateExpiration ? new Date(certification.dateExpiration).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR') : ''}</strong>.
          </p>
          <button style={styles.backToStatusBtn} onClick={onBack}>{t('certificationRequest.backToDashboard')}</button>
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
            <ArrowLeft size={18} /> {t('certificationRequest.back')}
          </button>
          <div style={styles.headerBadge}>
            <Shield size={28} color="#ffffff" />
          </div>
          <h1 style={styles.title}>{t('certificationRequest.formTitle')}</h1>
          <p style={styles.subtitle}>
            {t('certificationRequest.formSubtitle')}
          </p>
        </div>

        <div style={{ ...styles.grid, ...(isMobile && { gridTemplateColumns: '1fr', gap: '20px' }) }}>

          <div style={styles.formCard}>

            <h3 style={styles.sectionTitle}>{t('certificationRequest.idSection')}</h3>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('certificationRequest.docType')}</label>
              <select style={styles.input} value={typeDocument} onChange={(e) => setTypeDocument(e.target.value)}>
                {TYPES_DOCUMENT.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div style={{ ...styles.row2, ...(isMobile && { gridTemplateColumns: '1fr' }) }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>{t('certificationRequest.front')}</label>
                <div style={styles.uploadZone} onClick={() => rectoRef.current.click()}>
                  <input ref={rectoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload(setIdRecto)} />
                  {idRecto ? <img src={idRecto} alt="Recto" style={styles.previewImg} /> : <ImageIcon size={24} color="#2d6a4f" />}
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>{t('certificationRequest.back_side')}</label>
                <div style={styles.uploadZone} onClick={() => versoRef.current.click()}>
                  <input ref={versoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload(setIdVerso)} />
                  {idVerso ? <img src={idVerso} alt="Verso" style={styles.previewImg} /> : <ImageIcon size={24} color="#2d6a4f" />}
                </div>
              </div>
            </div>

            <h3 style={styles.sectionTitle}>{t('certificationRequest.yourPhoto')}</h3>
            <p style={styles.hint}>{t('certificationRequest.photoHint')}</p>
            <div style={styles.uploadZone} onClick={() => photoRef.current.click()}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload(setPhotoUtilisateur)} />
              {photoUtilisateur ? <img src={photoUtilisateur} alt="Vous" style={styles.previewImg} /> : <ImageIcon size={24} color="#2d6a4f" />}
            </div>

            <h3 style={styles.sectionTitle}>{t('certificationRequest.durationSection')}</h3>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('certificationRequest.certDuration')}</label>
              <div style={styles.dureeRow}>
                {DUREES.map(d => (
                  <button
                    key={d.mois}
                    type="button"
                    onClick={() => setDureeMois(d.mois)}
                    style={{ ...styles.dureeBtn, ...(dureeMois === d.mois ? styles.dureeBtnActive : {}) }}
                  >
                    {t('certificationRequest.durationMonths', { count: d.mois })}<br /><strong>{d.montant} FCFA</strong>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('certificationRequest.paymentMethod')}</label>
              <select style={styles.input} value={moyenPaiement} onChange={(e) => setMoyenPaiement(e.target.value)}>
                <option value="MTN_MOMO">MTN Mobile Money</option>
                <option value="ORANGE_MONEY">Orange Money</option>
              </select>
            </div>

            {numeroReception && (
              <div style={styles.infoBox}>
                <AlertCircle size={16} color="#e07a5f" />
                <span style={styles.infoText}>
                  {t('certificationRequest.payAt')} <strong>{montantSelectionne} {t('certificationRequest.payAtMiddle')} {numeroReception}</strong>{t('certificationRequest.payAtEnd')}
                </span>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('certificationRequest.yourPaymentNumber')}</label>
              <input
                type="tel"
                placeholder={t('certificationRequest.phonePlaceholder')}
                style={styles.input}
                value={numeroPaiement}
                onChange={(e) => setNumeroPaiement(e.target.value)}
              />
            </div>

            {error && <p style={styles.errorText}>{error}</p>}

            <button style={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
              <Shield size={18} /> {submitting ? t('certificationRequest.sending') : t('certificationRequest.sendRequest')}
            </button>
          </div>

          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>{t('certificationRequest.whyCertify')}</h3>
            <div style={styles.benefitList}>
              <div style={styles.benefitItem}>
                <CheckCircle size={18} color="#2d6a4f" />
                <span>{t('certificationRequest.benefit1')}</span>
              </div>
              <div style={styles.benefitItem}>
                <CheckCircle size={18} color="#2d6a4f" />
                <span>{t('certificationRequest.benefit2')}</span>
              </div>
              <div style={styles.benefitItem}>
                <CheckCircle size={18} color="#2d6a4f" />
                <span>{t('certificationRequest.benefit3')}</span>
              </div>
            </div>
            <div style={styles.infoBox}>
              <AlertCircle size={16} color="#e07a5f" />
              <span style={styles.infoText}>
                {t('certificationRequest.reviewNotice')}
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
