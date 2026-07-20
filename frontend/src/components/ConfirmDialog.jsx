import React from 'react';
import { useTranslation } from 'react-i18next';

// Remplace window.confirm(), qui affiche la popup native du navigateur
// (ex. "localhost:3000 dit...") au lieu d'une fenêtre cohérente avec le
// reste de l'interface. Utilisation :
//
//   const [confirmState, setConfirmState] = useState(null); // { message, onConfirm }
//   ...
//   setConfirmState({
//     message: 'Supprimer ce produit ?',
//     onConfirm: () => { /* action réelle */ },
//   });
//   ...
//   <ConfirmDialog
//     open={!!confirmState}
//     message={confirmState?.message}
//     onCancel={() => setConfirmState(null)}
//     onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
//   />
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{title || t('common.confirmationTitle')}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>{cancelLabel || t('common.cancel')}</button>
          <button
            style={{ ...styles.confirmBtn, backgroundColor: danger ? '#dc3545' : '#2d6a4f' }}
            onClick={onConfirm}
          >
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    padding: '16px',
  },
  dialog: {
    backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px',
    maxWidth: '380px', width: '100%', boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
  },
  title: { fontSize: '17px', fontWeight: '800', color: '#212529', margin: '0 0 8px 0' },
  message: { fontSize: '14px', color: '#495057', margin: '0 0 20px 0', lineHeight: '1.5' },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '10px 18px', borderRadius: '10px', border: '1px solid #dee2e6',
    backgroundColor: '#ffffff', color: '#495057', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
  confirmBtn: {
    padding: '10px 18px', borderRadius: '10px', border: 'none',
    color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
};
