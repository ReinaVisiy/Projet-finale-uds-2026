// src/components/LitigeModal.jsx
// Modale d'ouverture d'un litige (module Litige, commande-service) sur une
// commande livrée. Reprend le style et le comportement de SignalementModal
// pour une expérience cohérente entre les deux flux de signalement/litige.
import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TYPES_LITIGE } from '../services/api/litigeApi';

export default function LitigeModal({ order, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');

  const typeLabels = {
    [TYPES_LITIGE.PRODUIT_NON_LIVRE]: t('litige.typeProduitNonLivre'),
    [TYPES_LITIGE.PRODUIT_ENDOMMAGE]: t('litige.typeProduitEndommage'),
    [TYPES_LITIGE.QUALITE_INSUFFISANTE]: t('litige.typeQualiteInsuffisante'),
    [TYPES_LITIGE.QUANTITE_INCORRECTE]: t('litige.typeQuantiteIncorrecte'),
    [TYPES_LITIGE.AUTRE]: t('litige.typeAutre'),
  };

  const estAutre = type === TYPES_LITIGE.AUTRE;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!type) { alert(t('litige.selectType')); return; }
    if (estAutre && !description.trim()) { alert(t('litige.descriptionRequiredForOther')); return; }
    if (onSubmit) {
      onSubmit({ type, description });
    }
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            <AlertTriangle size={20} color="#e07a5f" /> {t('litige.openTitle')}
          </h3>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <p style={styles.subtitle}>{t('litige.order')} : <strong>#{order?.id}</strong></p>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>{t('litige.typeLabel')}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={styles.select}>
              <option value="">{t('litige.selectPlaceholder')}</option>
              {Object.values(TYPES_LITIGE).map(v => (
                <option key={v} value={v}>{typeLabels[v]}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>
              {estAutre ? t('litige.descriptionLabelRequired') : t('litige.description')}
            </label>
            <textarea
              style={styles.textarea}
              rows="3"
              placeholder={estAutre ? t('litige.descriptionPlaceholderRequired') : t('litige.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>{t('litige.cancel')}</button>
            <button type="submit" style={styles.submitBtn}>{t('litige.send')}</button>
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
    zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '20px', padding: '28px',
    maxWidth: '480px', width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  title: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#212529', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', padding: '4px' },
  subtitle: { fontSize: '14px', color: '#6c757d', marginBottom: '20px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#343a40', marginBottom: '6px' },
  select: { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', backgroundColor: '#f8f9fa' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', backgroundColor: '#f8f9fa', resize: 'vertical', fontFamily: 'inherit' },
  actions: { display: 'flex', gap: '12px', marginTop: '20px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  submitBtn: { flex: 1, padding: '12px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
};
