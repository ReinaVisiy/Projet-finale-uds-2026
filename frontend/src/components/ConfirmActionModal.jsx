// src/components/ConfirmActionModal.jsx
//
// Fenêtre de confirmation intégrée à l'interface, utilisée à la place de
// window.prompt()/window.confirm() (qui affichent une popup native du
// navigateur avec l'adresse du site, peu professionnelle en production).
//
// Deux modes :
//  - mode="suspend" : demande un nombre de jours (suspension d'un compte).
//  - mode="delete"  : simple confirmation avant une action destructrice.
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ConfirmActionModal({
  mode = 'delete', // 'suspend' | 'delete'
  title,
  message,
  targetLabel,
  confirmLabel,
  defaultDays = 7,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  const [jours, setJours] = useState(defaultDays);

  const handleConfirm = () => {
    if (mode === 'suspend') {
      const valeur = parseInt(jours, 10);
      if (!valeur || valeur <= 0) {
        alert(t('confirmActionModal.invalidDays'));
        return;
      }
      onConfirm(valeur);
    } else {
      onConfirm();
    }
  };

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            <AlertTriangle size={20} color="#e07a5f" /> {title}
          </h3>
          <button style={styles.closeBtn} onClick={onCancel}><X size={18} /></button>
        </div>
        {targetLabel && (
          <p style={styles.subtitle}>{targetLabel}</p>
        )}
        {message && <p style={styles.message}>{message}</p>}

        {mode === 'suspend' && (
          <div style={styles.field}>
            <label style={styles.label}>{t('confirmActionModal.daysLabel')}</label>
            <input
              type="number"
              min="1"
              style={styles.input}
              value={jours}
              onChange={(e) => setJours(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={onCancel}>
            {t('confirmActionModal.cancel')}
          </button>
          <button type="button" style={styles.confirmBtn} onClick={handleConfirm}>
            {confirmLabel || t('confirmActionModal.confirm')}
          </button>
        </div>
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
    maxWidth: '420px', width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  title: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#212529', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', padding: '4px' },
  subtitle: { fontSize: '14px', fontWeight: '700', color: '#343a40', marginBottom: '4px' },
  message: { fontSize: '14px', color: '#6c757d', marginBottom: '16px' },
  field: { marginBottom: '8px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#343a40', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', backgroundColor: '#f8f9fa', boxSizing: 'border-box' },
  actions: { display: 'flex', gap: '12px', marginTop: '20px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: '12px', backgroundColor: '#c0392b', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
};
