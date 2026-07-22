// src/components/ClientProfile.jsx
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Star, MessageCircle, Flag, User } from 'lucide-react';
import { avisApi, produitApi } from '../services/api';
import { mapProduitPourVitrine } from '../services/productMapping';
import { useTranslation } from 'react-i18next';


// Profil public d'un client : ses infos, puis la liste de tous les avis
// qu'il a laissés sur des produits (carte avis + lien vers le produit).
export default function ClientProfile({
  client, // { id, nom, prenom? }
  onBack,
  onContactVendor,
  onNavigateToProduct,
  onSignaler, // () => void — ouvre la modale de signalement partagée
}) {
  const { t } = useTranslation();
  const [avis, setAvis] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [chargeErreur, setChargeErreur] = useState(null);

  const chargerAvis = useCallback(async () => {
    if (!client?.id) { setChargement(false); return; }
    setChargement(true);
    setChargeErreur(null);
    try {
      const avisBruts = await avisApi.getAvisParClient(client.id);
      const enrichis = await Promise.all(
        (avisBruts || []).map(async (a) => {
          try {
            const produit = await produitApi.getProduitById(a.produitId);
            return { ...a, produit: mapProduitPourVitrine(produit) };
          } catch {
            return { ...a, produit: null };
          }
        })
      );
      setAvis(enrichis);
    } catch (e) {
      setChargeErreur(e?.message || t('clientProfile.loadFailed'));
    } finally {
      setChargement(false);
    }
  }, [client?.id, t]);

  useEffect(() => { chargerAvis(); }, [chargerAvis]);

  const StarRow = ({ value, size = 14 }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= Math.round(value) ? '#f5b041' : 'none'} color={i <= Math.round(value) ? '#f5b041' : '#dee2e6'} />
      ))}
    </div>
  );

  if (!client) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.emptyState}>
          <p>{t('clientProfile.noUserSelected')}</p>
          <button style={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /> {t('clientProfile.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} /> {t('clientProfile.back')}
        </button>

        {/* En-tête client */}
        <div style={styles.headerCard}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>
              {client.photo ? (
                <img src={client.photo} alt={client.nom} style={styles.avatarImg} />
              ) : (
                client.nom?.[0]?.toUpperCase() || <User size={24} />
              )}
            </div>
            <div>
              <h1 style={styles.name}>{client.prenom ? `${client.prenom} ${client.nom}` : client.nom}</h1>
              <span style={styles.roleTag}>{t('clientProfile.client')}</span>
            </div>
          </div>
          {onContactVendor && (
            <button style={styles.contactBtn} onClick={() => onContactVendor({ id: client.id, name: client.nom })}>
              <MessageCircle size={16} /> {t('clientProfile.contact')}
            </button>
          )}
        </div>

        {/* Signaler cet utilisateur (même modale que "signaler produit") */}
        <div style={styles.reportRow}>
          <button style={styles.reportLink} onClick={() => onSignaler && onSignaler()}>
            <Flag size={13} /> {t('clientProfile.reportUser')}
          </button>
        </div>

        {chargeErreur && <div style={styles.errorBanner}>{chargeErreur}</div>}

        {/* Liste des avis laissés */}
        <div style={styles.listSection}>
          <h3 style={styles.sectionTitle}>{t('clientProfile.reviewsLeft')} ({avis.length})</h3>
          {chargement ? (
            <p style={styles.hint}>{t('clientProfile.loadingReviews')}</p>
          ) : avis.length === 0 ? (
            <p style={styles.emptyText}>{t('clientProfile.noReviews')}</p>
          ) : (
            <div style={styles.avisList}>
              {avis.map((a) => (
                <div key={a.id} style={styles.avisItem}>
                  <div style={styles.avisAvatar}>{a.produit?.name?.[0]?.toUpperCase() || 'P'}</div>
                  <div style={styles.avisBody}>
                    <div style={styles.avisTopRow}>
                      <button
                        style={styles.avisProduitLink}
                        onClick={() => a.produit && onNavigateToProduct && onNavigateToProduct(a.produit)}
                        disabled={!a.produit}
                      >
                        {a.produit?.name || t('clientProfile.unavailableProduct')}
                      </button>
                      <span style={styles.avisDate}>{new Date(a.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <StarRow value={a.note} size={14} />
                    <p style={styles.avisComment}>{a.commentaire}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  container: { maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' },

  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#212529', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '20px', padding: 0 },

  headerCard: { backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e9ecef', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#2d6a4f', color: '#ffffff', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  name: { fontSize: '20px', fontWeight: '900', color: '#1b4d3e', margin: '0 0 6px 0' },
  roleTag: { fontSize: '11px', fontWeight: '800', color: '#495057', backgroundColor: '#f1f3f5', padding: '3px 10px', borderRadius: '20px' },
  contactBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 },

  reportRow: { marginBottom: '20px' },
  errorBanner: { backgroundColor: '#fdecea', color: '#b3261e', fontSize: '13px', fontWeight: '600', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px' },
  reportLink: { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#adb5bd', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', padding: 0 },
  reportBox: { backgroundColor: '#fff5f2', borderRadius: '14px', padding: '16px', border: '1px solid #f5d4c8' },
  label: { display: 'block', fontSize: '12px', fontWeight: '700', color: '#495057', marginBottom: '8px' },
  textarea: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #dee2e6', fontSize: '13.5px', backgroundColor: '#ffffff', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '10px' },
  formActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '12px 22px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' },
  reportSubmitBtn: { padding: '12px 22px', backgroundColor: '#c0392b', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer' },

  sectionTitle: { fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 16px 0' },
  hint: { fontSize: '13px', color: '#6c757d', fontWeight: '600' },
  emptyText: { fontSize: '13px', color: '#adb5bd', fontWeight: '500' },

  listSection: { backgroundColor: '#ffffff', borderRadius: '18px', padding: '22px', border: '1px solid #e9ecef' },
  avisList: { display: 'flex', flexDirection: 'column', gap: '18px' },
  avisItem: { display: 'flex', gap: '14px', paddingBottom: '18px', borderBottom: '1px solid #f1f3f5' },
  avisAvatar: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#e9f5ee', color: '#1b4d3e', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avisBody: { flex: 1 },
  avisTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '10px' },
  avisProduitLink: { background: 'none', border: 'none', padding: 0, fontSize: '13.5px', fontWeight: '800', color: '#2d6a4f', cursor: 'pointer', textAlign: 'left' },
  avisDate: { fontSize: '11.5px', color: '#adb5bd', fontWeight: '600', flexShrink: 0 },
  avisComment: { fontSize: '13.5px', color: '#495057', lineHeight: '1.5', margin: '6px 0 0 0' },

  emptyState: { textAlign: 'center', padding: '80px 24px', color: '#adb5bd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
};
