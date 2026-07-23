// src/components/AvisPlateformeModal.jsx
// Pop-up proposé à la déconnexion, une seule fois par utilisateur : demande
// un avis sur la plateforme elle-même (pas sur un produit). Reprend le
// style de LitigeModal/SignalementModal, et le sélecteur d'étoiles cliquable
// de ProductDetail (leaveReview) pour rester cohérent avec l'avis produit.
import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { publierAvisPlateforme } from '../services/api/avisApi';

export default function AvisPlateformeModal({ onSkip, onSubmitted }) {
  const { t } = useTranslation();
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note) {
      setErreur(t('avisPlateforme.selectRatingError'));
      return;
    }
    setEnvoiEnCours(true);
    setErreur('');
    try {
      await publierAvisPlateforme({ note, commentaire });
      onSubmitted();
    } catch (err) {
      setErreur(err?.message || t('avisPlateforme.submitError'));
      setEnvoiEnCours(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onSkip}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{t('avisPlateforme.popupTitle')}</h3>
          <button
            type="button"
            style={styles.closeBtn}
            onClick={onSkip}
            aria-label={t('avisPlateforme.skip')}
          >
            <X size={18} />
          </button>
        </div>
        <p style={styles.subtitle}>{t('avisPlateforme.popupSubtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <div style={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={30}
                  style={{ cursor: 'pointer' }}
                  fill={i <= note ? '#f5b041' : 'none'}
                  color="#f5b041"
                  onClick={() => setNote(i)}
                />
              ))}
            </div>
          </div>
          <div style={styles.field}>
            <textarea
              style={styles.textarea}
              rows="3"
              placeholder={t('avisPlateforme.commentPlaceholder')}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </div>

          {erreur && <p style={styles.erreur}>{erreur}</p>}

          <div style={styles.actions}>
            <button type="button" style={styles.skipBtn} onClick={onSkip} disabled={envoiEnCours}>
              {t('avisPlateforme.skip')}
            </button>
            <button type="submit" style={styles.submitBtn} disabled={envoiEnCours}>
              {envoiEnCours ? t('avisPlateforme.sending') : t('avisPlateforme.submit')}
            </button>
          </div>
        </form>
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
    maxWidth: '440px', width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  title: { fontSize: '18px', fontWeight: '800', color: '#212529', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', padding: '4px' },
  subtitle: { fontSize: '14px', color: '#6c757d', marginBottom: '20px' },
  field: { marginBottom: '16px' },
  stars: { display: 'flex', gap: '6px', justifyContent: 'center' },
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #dee2e6',
    fontSize: '14px', backgroundColor: '#f8f9fa', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  erreur: { fontSize: '13px', color: '#e07a5f', marginTop: '-8px', marginBottom: '12px' },
  actions: { display: 'flex', gap: '12px', marginTop: '8px' },
  skipBtn: {
    flex: 1, padding: '12px', backgroundColor: '#f1f3f5', color: '#495057',
    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  },
  submitBtn: {
    flex: 1, padding: '12px', backgroundColor: '#2d6a4f', color: '#ffffff',
    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  },
};
