import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Star, MessageCircle, ShieldCheck, Edit3, Trash2, Flag } from 'lucide-react';
import { produitApi, avisApi } from '../services/api';

// Un avis (backend AvisResponse) : { id, note, commentaire, date, clientId, clientNom, produitId }
export default function ProducerProfile({
  producteur,
  currentUser,
  onBack,
  onContactVendor,
  onNavigateToLogin,
  onSignalerProducteur, // (motif) => void
}) {
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [note, setNote] = useState(0);
  const [hoverNote, setHoverNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const [avisList, setAvisList] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [chargeErreur, setChargeErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // Charge tous les produits du producteur, puis tous les avis de ces
  // produits (avis-service note un produit, pas directement un producteur).
  const chargerAvis = useCallback(async () => {
    if (!producteur?.id) {
      setChargement(false);
      return;
    }
    setChargement(true);
    setChargeErreur(null);
    try {
      const produits = await produitApi.getProduitsParProducteur(producteur.id);
      const avisParProduit = await Promise.all(
        (produits || []).map((p) => avisApi.getAvisParProduit(p.id).catch(() => []))
      );
      setAvisList(avisParProduit.flat());
    } catch (e) {
      setChargeErreur(e?.message || 'Impossible de charger les avis.');
    } finally {
      setChargement(false);
    }
  }, [producteur?.id]);

  useEffect(() => {
    chargerAvis();
  }, [chargerAvis]);

  const producteurAvis = avisList;
  const totalAvis = producteurAvis.length;
  const moyenne = totalAvis > 0
    ? (producteurAvis.reduce((sum, a) => sum + a.note, 0) / totalAvis)
    : 0;

  // Répartition par note (5 → 1)
  const distribution = [5, 4, 3, 2, 1].map(n => {
    const count = producteurAvis.filter(a => a.note === n).length;
    return { note: n, count, pct: totalAvis > 0 ? (count / totalAvis) * 100 : 0 };
  });

  // Un client ne peut laisser qu'un seul avis par producteur (on retrouve le sien s'il existe)
  const monAvis = currentUser?.role === 'client'
    ? producteurAvis.find(a => a.clientId === currentUser.id)
    : null;

  const startEdit = (avis) => {
    setNote(avis.note);
    setCommentaire(avis.commentaire);
    setEditing(true);
    setError('');
  };

  const cancelEdit = () => {
    setNote(0);
    setCommentaire('');
    setEditing(false);
    setError('');
  };

  const handleSubmit = async () => {
    if (note === 0) { setError('Sélectionnez une note de 1 à 5 étoiles'); return; }
    if (!commentaire.trim()) { setError('Le commentaire est requis'); return; }
    if (!producteur.produitId) {
      setError("Impossible de déterminer le produit à noter : consultez un produit de ce producteur d'abord.");
      return;
    }
    setEnvoiEnCours(true);
    setError('');
    try {
      if (monAvis) {
        await avisApi.modifierAvis(monAvis.id, { produitId: producteur.produitId, note, commentaire });
      } else {
        await avisApi.publierAvis({ produitId: producteur.produitId, note, commentaire });
      }
      setNote(0);
      setCommentaire('');
      setEditing(false);
      await chargerAvis();
    } catch (e) {
      setError(e?.message || "La publication de l'avis a échoué.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const handleDelete = async (avisId) => {
    if (!window.confirm('Supprimer votre avis ?')) return;
    setEnvoiEnCours(true);
    setError('');
    try {
      await avisApi.supprimerAvis(avisId);
      await chargerAvis();
    } catch (e) {
      setError(e?.message || "La suppression de l'avis a échoué.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const handleSubmitReport = () => {
    if (!reportReason.trim()) return;
    onSignalerProducteur && onSignalerProducteur(reportReason);
    setReportReason('');
    setShowReportBox(false);
  };

  const StarRow = ({ value, size = 16, interactive = false }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = interactive
          ? i <= (hoverNote || note)
          : i <= Math.round(value);
        return (
          <Star
            key={i}
            size={size}
            fill={filled ? '#f5b041' : 'none'}
            color={filled ? '#f5b041' : '#dee2e6'}
            style={interactive ? { cursor: 'pointer' } : {}}
            onMouseEnter={interactive ? () => setHoverNote(i) : undefined}
            onMouseLeave={interactive ? () => setHoverNote(0) : undefined}
            onClick={interactive ? () => { setNote(i); setError(''); } : undefined}
          />
        );
      })}
    </div>
  );

  if (!producteur) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.emptyState}>
          <p>Aucun producteur sélectionné.</p>
          <button style={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /> Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>

        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} /> Retour
        </button>

        {/* En-tête producteur */}
        <div style={styles.headerCard}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>
              {producteur.nom?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div style={styles.nameRow}>
                <h1 style={styles.name}>{producteur.prenom ? `${producteur.prenom} ${producteur.nom}` : producteur.nom}</h1>
                {producteur.verificationStatus === 'approved' && (
                  <span style={styles.verifiedBadge}><ShieldCheck size={14} /> Vérifié</span>
                )}
              </div>
              <div style={styles.ratingRow}>
                <StarRow value={moyenne} size={18} />
                <span style={styles.ratingNumber}>{moyenne > 0 ? moyenne.toFixed(1) : '—'}</span>
                <span style={styles.ratingCount}>({totalAvis} avis)</span>
              </div>
            </div>
          </div>
          {onContactVendor && (
            <button style={styles.contactBtn} onClick={() => onContactVendor({ id: producteur.id, name: producteur.nom })}>
              <MessageCircle size={16} /> Contacter
            </button>
          )}
        </div>

        {/* Signaler ce producteur */}
        <div style={styles.reportRow}>
          {!showReportBox ? (
            <button style={styles.reportLink} onClick={() => setShowReportBox(true)}>
              <Flag size={13} /> Signaler ce producteur
            </button>
          ) : (
            <div style={styles.reportBox}>
              <label style={styles.label}>Motif du signalement</label>
              <textarea
                style={styles.textarea}
                rows="3"
                placeholder="Ex: produit non conforme, comportement suspect, tentative d'arnaque..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <div style={styles.formActions}>
                <button style={styles.cancelBtn} onClick={() => { setShowReportBox(false); setReportReason(''); }}>Annuler</button>
                <button style={styles.reportSubmitBtn} onClick={handleSubmitReport}>Envoyer le signalement</button>
              </div>
            </div>
          )}
        </div>

        {chargeErreur && <div style={styles.errorBanner}>{chargeErreur}</div>}

        <div style={styles.grid}>

          {/* Répartition des notes */}
          <div style={styles.distribCard}>
            <h3 style={styles.sectionTitle}>Répartition des avis</h3>
            {chargement ? (
              <p style={styles.hint}>Chargement des avis...</p>
            ) : totalAvis === 0 ? (
              <p style={styles.emptyText}>Pas encore d'avis pour ce producteur.</p>
            ) : (
              <div style={styles.distribList}>
                {distribution.map((d) => (
                  <div key={d.note} style={styles.distribRow}>
                    <span style={styles.distribLabel}>{d.note} ★</span>
                    <div style={styles.distribBarBg}>
                      <div style={{ ...styles.distribBarFill, width: `${d.pct}%` }} />
                    </div>
                    <span style={styles.distribCount}>{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire avis */}
          <div style={styles.formCard}>
            {currentUser?.role !== 'client' ? (
              <div style={styles.loginPrompt}>
                <Star size={22} color="#f5b041" fill="#f5b041" />
                <p style={styles.hint}>
                  {currentUser?.role === 'vendeur'
                    ? 'Seuls les clients peuvent laisser un avis sur un producteur.'
                    : 'Connectez-vous en tant que client pour noter ce producteur.'}
                </p>
                {currentUser?.role !== 'vendeur' && (
                  <button style={styles.loginBtn} onClick={onNavigateToLogin}>
                    Se connecter pour laisser un avis
                  </button>
                )}
              </div>
            ) : monAvis && !editing ? (
              <div>
                <h3 style={styles.sectionTitle}>Votre avis</h3>
                <div style={styles.myAvisCard}>
                  <StarRow value={monAvis.note} size={16} />
                  <p style={styles.myAvisComment}>{monAvis.commentaire}</p>
                  <div style={styles.myAvisActions}>
                    <button style={styles.editBtn} onClick={() => startEdit(monAvis)} disabled={envoiEnCours}>
                      <Edit3 size={14} /> Modifier
                    </button>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(monAvis.id)} disabled={envoiEnCours}>
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ) : !producteur.produitId ? (
              <div style={styles.loginPrompt}>
                <p style={styles.hint}>
                  Consultez un produit de ce producteur pour pouvoir laisser un avis.
                </p>
              </div>
            ) : (
              <div>
                <h3 style={styles.sectionTitle}>
                  {editing ? 'Modifier votre avis' : 'Laisser un avis'}
                </h3>
                <div style={styles.starPicker}>
                  <StarRow value={note} size={28} interactive />
                </div>
                <textarea
                  style={styles.textarea}
                  rows="4"
                  placeholder="Partagez votre expérience avec ce producteur..."
                  value={commentaire}
                  onChange={(e) => { setCommentaire(e.target.value); setError(''); }}
                />
                {error && <span style={styles.error}>{error}</span>}
                <div style={styles.formActions}>
                  {editing && (
                    <button style={styles.cancelBtn} onClick={cancelEdit}>Annuler</button>
                  )}
                  <button style={styles.submitBtn} onClick={handleSubmit} disabled={envoiEnCours}>
                    {envoiEnCours ? 'Envoi...' : editing ? 'Mettre à jour' : 'Publier mon avis'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Liste des avis */}
        <div style={styles.listSection}>
          <h3 style={styles.sectionTitle}>Tous les avis ({totalAvis})</h3>
          {chargement ? (
            <p style={styles.hint}>Chargement des avis...</p>
          ) : totalAvis === 0 ? (
            <p style={styles.emptyText}>Soyez le premier à laisser un avis sur ce producteur.</p>
          ) : (
            <div style={styles.avisList}>
              {producteurAvis
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((avis) => (
                  <div key={avis.id} style={styles.avisItem}>
                    <div style={styles.avisAvatar}>{avis.clientNom?.[0]?.toUpperCase() || 'C'}</div>
                    <div style={styles.avisBody}>
                      <div style={styles.avisTopRow}>
                        <span style={styles.avisAuthor}>{avis.clientNom}</span>
                        <span style={styles.avisDate}>
                          {new Date(avis.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <StarRow value={avis.note} size={14} />
                      <p style={styles.avisComment}>{avis.commentaire}</p>
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
  avatar: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#2d6a4f', color: '#ffffff', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  name: { fontSize: '20px', fontWeight: '900', color: '#1b4d3e', margin: 0 },
  verifiedBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: '#2d6a4f', backgroundColor: '#e9f5ee', padding: '3px 10px', borderRadius: '20px' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  ratingNumber: { fontSize: '14px', fontWeight: '800', color: '#212529' },
  ratingCount: { fontSize: '13px', color: '#6c757d', fontWeight: '600' },
  contactBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 },

  reportRow: { marginBottom: '20px' },
  errorBanner: { backgroundColor: '#fdecea', color: '#b3261e', fontSize: '13px', fontWeight: '600', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px' },
  reportLink: { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#adb5bd', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', padding: 0 },
  reportBox: { backgroundColor: '#fff5f2', borderRadius: '14px', padding: '16px', border: '1px solid #f5d4c8' },
  reportSubmitBtn: { padding: '12px 22px', backgroundColor: '#c0392b', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer' },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px', marginBottom: '24px', alignItems: 'start' },
  sectionTitle: { fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 16px 0' },
  hint: { fontSize: '13px', color: '#6c757d', fontWeight: '600' },
  emptyText: { fontSize: '13px', color: '#adb5bd', fontWeight: '500' },

  distribCard: { backgroundColor: '#ffffff', borderRadius: '18px', padding: '22px', border: '1px solid #e9ecef' },
  distribList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  distribRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  distribLabel: { fontSize: '12px', fontWeight: '700', color: '#495057', width: '28px' },
  distribBarBg: { flex: 1, height: '8px', backgroundColor: '#f1f3f5', borderRadius: '8px', overflow: 'hidden' },
  distribBarFill: { height: '100%', backgroundColor: '#f5b041', borderRadius: '8px' },
  distribCount: { fontSize: '12px', fontWeight: '700', color: '#adb5bd', width: '20px', textAlign: 'right' },

  formCard: { backgroundColor: '#ffffff', borderRadius: '18px', padding: '22px', border: '1px solid #e9ecef' },
  loginPrompt: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', padding: '12px 0' },
  loginBtn: { padding: '12px 22px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer' },
  starPicker: { marginBottom: '14px' },
  textarea: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #dee2e6', fontSize: '13.5px', backgroundColor: '#f8f9fa', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '10px' },
  error: { fontSize: '12px', color: '#e07a5f', fontWeight: '600', display: 'block', marginBottom: '10px' },
  formActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  submitBtn: { padding: '12px 22px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer' },
  cancelBtn: { padding: '12px 22px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' },

  myAvisCard: { backgroundColor: '#f8f9fa', borderRadius: '14px', padding: '16px', border: '1px solid #e9ecef' },
  myAvisComment: { fontSize: '13.5px', color: '#495057', lineHeight: '1.5', margin: '10px 0' },
  myAvisActions: { display: 'flex', gap: '10px' },
  editBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#e9f5ee', color: '#2d6a4f', border: 'none', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' },
  deleteBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#fdecea', color: '#c0392b', border: 'none', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' },

  listSection: { backgroundColor: '#ffffff', borderRadius: '18px', padding: '22px', border: '1px solid #e9ecef' },
  avisList: { display: 'flex', flexDirection: 'column', gap: '18px' },
  avisItem: { display: 'flex', gap: '14px', paddingBottom: '18px', borderBottom: '1px solid #f1f3f5' },
  avisAvatar: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#e9f5ee', color: '#1b4d3e', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avisBody: { flex: 1 },
  avisTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  avisAuthor: { fontSize: '13.5px', fontWeight: '800', color: '#212529' },
  avisDate: { fontSize: '11.5px', color: '#adb5bd', fontWeight: '600' },
  avisComment: { fontSize: '13.5px', color: '#495057', lineHeight: '1.5', margin: '6px 0 0 0' },

  emptyState: { textAlign: 'center', padding: '80px 24px', color: '#adb5bd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
};