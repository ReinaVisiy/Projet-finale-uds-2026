// src/components/AvisPlateformeListeModal.jsx
// Modale "voir plus" ouverte depuis la section "Ce que disent nos
// utilisateurs" de la page d'accueil : liste tous les avis plateforme
// (meilleure note d'abord, cf. tri backend).
import { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAvisPlateforme } from '../services/api/avisApi';

export default function AvisPlateformeListeModal({ onClose }) {
  const { t } = useTranslation();
  const [avis, setAvis] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;
    getAvisPlateforme()
      .then((liste) => { if (!annule) setAvis(liste || []); })
      .catch((err) => { if (!annule) setErreur(err?.message || t('avisPlateforme.loadError')); })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [t]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{t('avisPlateforme.listTitle')}</h3>
          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label={t('litige.cancel')}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.body}>
          {chargement ? (
            <p style={styles.info}>{t('productDetail.loadingReviews')}</p>
          ) : erreur ? (
            <p style={styles.info}>{erreur}</p>
          ) : avis.length === 0 ? (
            <p style={styles.info}>{t('avisPlateforme.listEmpty')}</p>
          ) : (
            avis.map((a) => (
              <div key={a.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.nom}>{a.clientNom}</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} fill={i <= a.note ? '#f5b041' : 'none'} color="#f5b041" />
                    ))}
                  </div>
                </div>
                {a.commentaire && <p style={styles.commentaire}>{a.commentaire}</p>}
                <span style={styles.date}>{a.date}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, backdropFilter: 'blur(4px)', padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '20px', padding: '28px',
    maxWidth: '560px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 },
  title: { fontSize: '18px', fontWeight: '800', color: '#212529', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', padding: '4px' },
  body: { overflowY: 'auto' },
  info: { fontSize: '14px', color: '#6c757d', textAlign: 'center', padding: '24px 0' },
  card: { padding: '14px 0', borderBottom: '1px solid #eef1f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  nom: { fontSize: '14px', fontWeight: '700', color: '#212529' },
  commentaire: { fontSize: '13px', color: '#495057', margin: '0 0 6px 0', lineHeight: 1.5 },
  date: { fontSize: '12px', color: '#adb5bd' },
};
