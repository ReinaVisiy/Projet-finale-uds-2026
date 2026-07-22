import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ShieldCheck, FileText, CreditCard, CheckCircle,
  XCircle, Clock, AlertCircle, Phone, Mail, Search, Wallet,
} from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

// pendingVerifications: [{ id, producteurId, prenom, nom, email, telephone,
//   typeDocument, typeDocumentLabel, idRecto, idVerso, photoUtilisateur,
//   dureeMois, montant, moyenPaiement, moyenPaiementLabel, numeroPaiement,
//   statutPaiement ('EN_ATTENTE'|'PAYE'|'NON_PAYE'), submittedAt, status,
//   motifRejet }]
export default function VendorVerificationAdmin({ pendingVerifications = [], onApprove, onReject, onConfirmerPaiement, onBack }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile(768);
  const [selectedId, setSelectedId] = useState(pendingVerifications[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const filtered = pendingVerifications.filter(v => {
    const q = search.toLowerCase();
    return (
      v.prenom?.toLowerCase().includes(q) ||
      v.nom?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q)
    );
  });

  const selected = pendingVerifications.find(v => v.id === selectedId) || filtered[0];

  const statusBadge = (status) => {
    if (status === 'approved') return { label: t('vendorVerificationAdmin.statusApproved'), bg: '#e9f5ee', color: '#2d6a4f' };
    if (status === 'rejected') return { label: t('vendorVerificationAdmin.statusRejected'), bg: '#fdecea', color: '#c0392b' };
    return { label: t('vendorVerificationAdmin.statusPending'), bg: '#fff8e8', color: '#f5b041' };
  };

  const paiementBadge = (statutPaiement) => {
    if (statutPaiement === 'PAYE') return { label: t('vendorVerificationAdmin.paymentPaid'), bg: '#e9f5ee', color: '#2d6a4f' };
    if (statutPaiement === 'NON_PAYE') return { label: t('vendorVerificationAdmin.paymentUnpaid'), bg: '#fdecea', color: '#c0392b' };
    return { label: t('vendorVerificationAdmin.paymentAwaiting'), bg: '#fff8e8', color: '#f5b041' };
  };

  const handleConfirmerPaiement = () => {
    if (!selected) return;
    onConfirmerPaiement && onConfirmerPaiement(selected.id);
  };

  const handleApprove = () => {
    if (!selected) return;
    onApprove(selected.id);
    setShowRejectBox(false);
  };

  const handleReject = () => {
    if (!selected) return;
    onReject(selected.id, rejectReason);
    setRejectReason('');
    setShowRejectBox(false);
  };

  const pendingCount = pendingVerifications.filter(v => v.status === 'pending').length;
  const approvedCount = pendingVerifications.filter(v => v.status === 'approved').length;
  const rejectedCount = pendingVerifications.filter(v => v.status === 'rejected').length;
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredByStatus = filtered.filter(v =>
    statusFilter === 'all' ? true : v.status === statusFilter
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>

        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={18} /> {t('vendorVerificationAdmin.back')}
          </button>
          <div style={styles.headerTitleRow}>
            <div style={styles.headerBadge}><ShieldCheck size={24} color="#ffffff" /></div>
            <div>
              <h1 style={styles.title}>{t('vendorVerificationAdmin.title')}</h1>
              <p style={styles.subtitle}>
                {t('vendorVerificationAdmin.pendingCount', { count: pendingCount })}
              </p>
            </div>
          </div>
        </div>

        <div style={styles.filterRow}>
          {[
            { id: 'all', label: t('vendorVerificationAdmin.filterAll'), count: pendingVerifications.length },
            { id: 'pending', label: t('vendorVerificationAdmin.filterPending'), count: pendingCount },
            { id: 'approved', label: t('vendorVerificationAdmin.filterApproved'), count: approvedCount },
            { id: 'rejected', label: t('vendorVerificationAdmin.filterRejected'), count: rejectedCount },
          ].map(f => (
            <button
              key={f.id}
              style={{ ...styles.filterBtn, ...(statusFilter === f.id ? styles.filterBtnActive : {}) }}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div style={{ ...styles.grid, ...(isMobile && { gridTemplateColumns: '1fr' }) }}>

          {/* Liste des demandes */}
          <div style={styles.listPanel}>
            <div style={styles.searchWrap}>
              <Search size={16} color="#adb5bd" />
              <input
                type="text"
                placeholder={t('vendorVerificationAdmin.searchPlaceholder')}
                style={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={styles.list}>
              {filteredByStatus.length === 0 && (
                <p style={styles.emptyText}>{t('vendorVerificationAdmin.noRequestsFound')}</p>
              )}
              {filteredByStatus.map((v) => {
                const badge = statusBadge(v.status);
                const isSelected = selected?.id === v.id;
                return (
                  <div
                    key={v.id}
                    style={{
                      ...styles.listItem,
                      ...(isSelected ? styles.listItemActive : {}),
                    }}
                    onClick={() => { setSelectedId(v.id); setShowRejectBox(false); }}
                  >
                    <div style={styles.listItemAvatar}>
                      {v.prenom?.[0]?.toUpperCase()}{v.nom?.[0]?.toUpperCase()}
                    </div>
                    <div style={styles.listItemInfo}>
                      <span style={styles.listItemName}>{v.prenom} {v.nom}</span>
                      <span style={styles.listItemEmail}>{v.email}</span>
                    </div>
                    <span style={{ ...styles.miniBadge, backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Détail de la demande */}
          <div style={styles.detailPanel}>
            {!selected ? (
              <div style={styles.emptyState}>
                <ShieldCheck size={48} color="#dee2e6" />
                <p>{t('vendorVerificationAdmin.selectRequest')}</p>
              </div>
            ) : (
              <>
                <div style={styles.detailHeader}>
                  <div style={styles.detailAvatar}>
                    {selected.prenom?.[0]?.toUpperCase()}{selected.nom?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 style={styles.detailName}>{selected.prenom} {selected.nom}</h2>
                    <span
                      style={{
                        ...styles.statusPill,
                        backgroundColor: statusBadge(selected.status).bg,
                        color: statusBadge(selected.status).color,
                      }}
                    >
                      {statusBadge(selected.status).label}
                    </span>
                  </div>
                </div>

                <div style={styles.contactRow}>
                  <div style={styles.contactItem}><Mail size={14} color="#6c757d" /> {selected.email}</div>
                  <div style={styles.contactItem}><Phone size={14} color="#6c757d" /> {selected.telephone}</div>
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}><FileText size={16} color="#2d6a4f" /> {selected.typeDocumentLabel || t('vendorVerificationAdmin.idDocument')}</h3>
                  {(selected.idRecto || selected.idVerso || selected.photoUtilisateur) ? (
                    <div style={{ ...styles.photoGrid, ...(isMobile && { gridTemplateColumns: 'repeat(2, 1fr)' }) }}>
                      {selected.idRecto && (
                        <div style={styles.photoItem}>
                          <img src={selected.idRecto} alt="Recto" style={styles.photoImg} />
                          <span style={styles.photoCaption}>{t('vendorVerificationAdmin.front')}</span>
                        </div>
                      )}
                      {selected.idVerso && (
                        <div style={styles.photoItem}>
                          <img src={selected.idVerso} alt="Verso" style={styles.photoImg} />
                          <span style={styles.photoCaption}>{t('vendorVerificationAdmin.back_side')}</span>
                        </div>
                      )}
                      {selected.photoUtilisateur && (
                        <div style={styles.photoItem}>
                          <img src={selected.photoUtilisateur} alt="Photo du titulaire" style={styles.photoImg} />
                          <span style={styles.photoCaption}>{t('vendorVerificationAdmin.holder')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={styles.missing}>{t('vendorVerificationAdmin.noDocuments')}</p>
                  )}
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}><CreditCard size={16} color="#2d6a4f" /> {t('vendorVerificationAdmin.requestDetails')}</h3>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>{t('vendorVerificationAdmin.requestedDuration')}</span>
                      <span style={styles.infoValue}>{t('vendorVerificationAdmin.durationMonths', { count: selected.dureeMois })}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>{t('vendorVerificationAdmin.amount')}</span>
                      <span style={styles.infoValue}>{selected.montant} FCFA</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>{t('vendorVerificationAdmin.paymentMethod')}</span>
                      <span style={styles.infoValue}>{selected.moyenPaiementLabel || '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>{t('vendorVerificationAdmin.paymentNumberUsed')}</span>
                      <span style={styles.infoValue}>{selected.numeroPaiement || '—'}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}><Wallet size={16} color="#2d6a4f" /> {t('vendorVerificationAdmin.paymentStatus')}</h3>
                  <span
                    style={{
                      ...styles.statusPill,
                      backgroundColor: paiementBadge(selected.statutPaiement).bg,
                      color: paiementBadge(selected.statutPaiement).color,
                    }}
                  >
                    {paiementBadge(selected.statutPaiement).label}
                  </span>
                  {selected.status === 'pending' && selected.statutPaiement !== 'PAYE' && (
                    <button style={styles.confirmPaymentBtn} onClick={handleConfirmerPaiement}>
                      {t('vendorVerificationAdmin.confirmPaymentReceived')}
                    </button>
                  )}
                </div>

                <div style={styles.tipBox}>
                  <AlertCircle size={16} color="#e07a5f" />
                  <span style={styles.tipText}>
                    {t('vendorVerificationAdmin.tipText')}
                  </span>
                </div>

                {selected.status === 'pending' && (
                  <>
                    {!showRejectBox ? (
                      <div style={styles.actionRow}>
                        <button style={styles.rejectBtn} onClick={() => setShowRejectBox(true)}>
                          <XCircle size={18} /> {t('vendorVerificationAdmin.reject')}
                        </button>
                        <button
                          style={{
                            ...styles.approveBtn,
                            ...(selected.statutPaiement !== 'PAYE' ? styles.approveBtnDisabled : {}),
                          }}
                          onClick={handleApprove}
                          disabled={selected.statutPaiement !== 'PAYE'}
                          title={selected.statutPaiement !== 'PAYE' ? t('vendorVerificationAdmin.confirmPaymentFirst') : ''}
                        >
                          <CheckCircle size={18} /> {t('vendorVerificationAdmin.approve')}
                        </button>
                      </div>
                    ) : (
                      <div style={styles.rejectBox}>
                        <label style={styles.label}>{t('vendorVerificationAdmin.rejectReasonLabel')}</label>
                        <textarea
                          style={styles.textarea}
                          rows="3"
                          placeholder={t('vendorVerificationAdmin.rejectReasonPlaceholder')}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div style={styles.actionRow}>
                          <button style={styles.backBtnSmall} onClick={() => setShowRejectBox(false)}>{t('vendorVerificationAdmin.cancel')}</button>
                          <button style={styles.rejectConfirmBtn} onClick={handleReject}>
                            {t('vendorVerificationAdmin.confirmReject')}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selected.status !== 'pending' && (
                  <div style={styles.decidedBox}>
                    <Clock size={16} color="#6c757d" />
                    <span>
                      {t('vendorVerificationAdmin.alreadyProcessed')}{selected.status === 'rejected' && selected.motifRejet ? t('vendorVerificationAdmin.reasonSuffix', { reason: selected.motifRejet }) : ''}.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' },

  header: { marginBottom: '28px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#212529', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '16px', padding: 0 },
  headerTitleRow: { display: 'flex', alignItems: 'center', gap: '14px' },
  headerBadge: { width: '48px', height: '48px', backgroundColor: '#2d6a4f', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: '22px', fontWeight: '900', color: '#1b4d3e', margin: 0 },
  subtitle: { fontSize: '13.5px', color: '#6c757d', margin: '2px 0 0 0', fontWeight: '600' },
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  filterBtn: { padding: '8px 14px', borderRadius: '20px', border: '1px solid #dee2e6', backgroundColor: '#ffffff', color: '#495057', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  filterBtnActive: { backgroundColor: '#1b4d3e', color: '#ffffff', borderColor: '#1b4d3e' },

  grid: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' },

  listPanel: { backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e9ecef', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '12px' },
  searchInput: { flex: 1, border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '13px' },
  list: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '620px', overflowY: 'auto' },
  emptyText: { fontSize: '13px', color: '#adb5bd', textAlign: 'center', padding: '24px 0' },
  listItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', cursor: 'pointer', border: '1px solid transparent' },
  listItemActive: { backgroundColor: '#e9f5ee', border: '1px solid #b7e4c7' },
  listItemAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2d6a4f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 },
  listItemInfo: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  listItemName: { fontSize: '13px', fontWeight: '700', color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  listItemEmail: { fontSize: '11.5px', color: '#adb5bd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  miniBadge: { fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' },

  detailPanel: { backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e9ecef', padding: '28px', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', minHeight: '400px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#adb5bd', fontSize: '14px', padding: '80px 0' },

  detailHeader: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' },
  detailAvatar: { width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#2d6a4f', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 },
  detailName: { fontSize: '19px', fontWeight: '900', color: '#212529', margin: '0 0 6px 0' },
  statusPill: { fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' },

  contactRow: { display: 'flex', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f3f5' },
  contactItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#495057', fontWeight: '600' },

  section: { marginBottom: '20px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', color: '#212529', margin: '0 0 10px 0' },
  missing: { fontSize: '12.5px', color: '#e07a5f', fontWeight: '600', fontStyle: 'italic' },

  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  photoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  photoImg: { width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e9ecef' },
  photoCaption: { fontSize: '11px', color: '#6c757d', fontWeight: '600', textAlign: 'center' },

  infoGrid: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #f1f3f5' },
  infoLabel: { fontSize: '12.5px', color: '#6c757d', fontWeight: '600' },
  infoValue: { fontSize: '12.5px', color: '#212529', fontWeight: '700', textAlign: 'right' },

  confirmPaymentBtn: { display: 'block', marginTop: '10px', padding: '10px 16px', backgroundColor: '#f0f7f4', color: '#2d6a4f', border: '1.5px solid #b7e4c7', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },

  tipBox: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px', backgroundColor: '#fff5f2', borderRadius: '12px', border: '1px solid #f5d4c8', marginBottom: '20px' },
  tipText: { fontSize: '12px', color: '#495057', lineHeight: '1.5' },

  actionRow: { display: 'flex', gap: '12px' },
  approveBtn: { flex: 1, padding: '14px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  approveBtnDisabled: { backgroundColor: '#adb5bd', cursor: 'not-allowed' },
  rejectBtn: { flex: 1, padding: '14px', backgroundColor: '#fdecea', color: '#c0392b', border: '1px solid #f5c6c0', borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  rejectConfirmBtn: { flex: 2, padding: '14px', backgroundColor: '#c0392b', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  backBtnSmall: { flex: 1, padding: '14px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },

  rejectBox: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#343a40' },
  textarea: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #dee2e6', fontSize: '13px', backgroundColor: '#f8f9fa', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },

  decidedBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', backgroundColor: '#f8f9fa', borderRadius: '12px', fontSize: '13px', color: '#6c757d', fontWeight: '600' },
};
