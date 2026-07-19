// src/components/SignalementModal.jsx
import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const motifs = [
  'Produit non conforme',
  'Arnaque / Fausse description',
  'Comportement inapproprié',
  'Retard de livraison',
  'Autre',
];

export default function SignalementModal({ product, onClose, onSubmit }) {
  const [motif, setMotif] = useState('');
  const [commentaire, setCommentaire] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motif) { alert('Veuillez sélectionner un motif'); return; }
    if (onSubmit) {
      onSubmit({
        type: 'produit',
        cible: product?.name || product?.nom || 'Produit inconnu',
        motif,
        commentaire,
        date: new Date().toISOString(),
        status: 'pending',
      });
    }
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            <AlertTriangle size={20} color="#e07a5f" /> Signaler un problème
          </h3>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <p style={styles.subtitle}>Produit : <strong>{product?.name || product?.nom}</strong></p>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Motif *</label>
            <select value={motif} onChange={(e) => setMotif(e.target.value)} style={styles.select}>
              <option value="">-- Sélectionnez --</option>
              {motifs.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Commentaire (optionnel)</label>
            <textarea
              style={styles.textarea}
              rows="3"
              placeholder="Décrivez précisément le problème..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </div>
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Annuler</button>
            <button type="submit" style={styles.submitBtn}>Envoyer le signalement</button>
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