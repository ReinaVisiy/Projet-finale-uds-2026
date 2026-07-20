import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export default function ModerationPanel({
  signalements = [],  // ← VALEUR PAR DÉFAUT
  onResolve,
  onReject,
  onBack,
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');

  const filtered = signalements.filter(s =>
    filter === 'all' ? true : s.status === filter
  );

  const getStatusStyle = (status) => {
    if (status === 'résolu' || status === 'resolved') return { color: '#2d6a4f', bg: '#e9f5ee', label: t('moderation.resolved') };
    if (status === 'rejeté' || status === 'rejected') return { color: '#e07a5f', bg: '#fdf1ed', label: t('moderation.rejected') };
    return { color: '#f5b041', bg: '#fffbea', label: t('moderation.waiting') };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}><AlertTriangle size={24} /> {t('moderation.title')}</h2>
        <button style={styles.backBtn} onClick={onBack}>{t('moderation.back')}</button>
      </div>

      <div style={styles.filters}>
        {['all', 'pending', 'resolved', 'rejected'].map(f => {
          const count = signalements.filter(s => f === 'all' ? true : s.status === f).length;
          return (
            <button
              key={f}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t('moderation.all') : f === 'pending' ? t('moderation.pendingF') : f === 'resolved' ? t('moderation.resolvedF') : t('moderation.rejectedF')}
              <span style={styles.filterCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <AlertTriangle size={40} color="#adb5bd" />
          <p>{t('moderation.noSignalements')}</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(s => {
            const st = getStatusStyle(s.status);
            return (
              <div key={s.id} style={styles.card}>
                <div style={styles.cardLeft}>
                  <div style={styles.avatar}>{s.cible?.[0]?.toUpperCase() || '?'}</div>
                  <div>
                    <p style={styles.cible}>{s.cible}</p>
                    <p style={styles.details}>
                      <span style={styles.motif}>{s.motif}</span>
                      <span style={styles.auteur}>{t('moderation.by')} {s.auteur}</span>
                      <span style={styles.date}>{new Date(s.date).toLocaleDateString('fr-FR')}</span>
                    </p>
                    {s.commentaire && <p style={styles.commentaire}>💬 {s.commentaire}</p>}
                  </div>
                </div>
                <div style={styles.cardRight}>
                  <span style={{ ...styles.statusBadge, color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                  {s.status === 'pending' && (
                    <div style={styles.actions}>
                      <button style={styles.resolveBtn} onClick={() => onResolve(s.id)}>
                        <CheckCircle size={14} /> {t('moderation.resolve')}
                      </button>
                      <button style={styles.rejectBtn} onClick={() => onReject(s.id)}>
                        <XCircle size={14} /> {t('moderation.reject')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '30px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: '900', color: '#212529', margin: 0 },
  backBtn: { padding: '10px 18px', backgroundColor: '#f1f3f5', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  filters: { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: '1.5px solid #dee2e6', backgroundColor: '#ffffff', color: '#6c757d', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  filterBtnActive: { backgroundColor: '#1b4d3e', borderColor: '#1b4d3e', color: '#ffffff' },
  filterCount: { backgroundColor: '#e9ecef', color: '#495057', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' },
  emptyState: { textAlign: 'center', padding: '60px 0', color: '#adb5bd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  list: { display: 'flex', flexDirection: 'column', gap: '14px' },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  cardLeft: { display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '200px' },
  avatar: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#e9f5ee', color: '#1b4d3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800' },
  cible: { fontSize: '15px', fontWeight: '700', color: '#212529', margin: '0 0 2px 0' },
  details: { fontSize: '13px', color: '#6c757d', margin: 0, display: 'flex', gap: '12px', flexWrap: 'wrap' },
  motif: { fontWeight: '600' },
  auteur: { color: '#495057' },
  date: { color: '#adb5bd' },
  commentaire: { fontSize: '13px', color: '#495057', margin: '4px 0 0 0', fontStyle: 'italic' },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 },
  statusBadge: { fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' },
  actions: { display: 'flex', gap: '8px' },
  resolveBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  rejectBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#fdf1ed', color: '#e07a5f', border: '1px solid #f5d4c8', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
};