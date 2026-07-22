import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star, MessageCircle, ShieldCheck, Edit3, Trash2, Flag, Package, MessageSquareText } from 'lucide-react';
import { produitApi, avisApi, certificationApi } from '../services/api';
import { mapProduitPourVitrine } from '../services/productMapping';
import ConfirmDialog from './ConfirmDialog';
import useIsMobile from '../hooks/useIsMobile';

// Un avis (backend AvisResponse) : { id, note, commentaire, date, clientId, clientNom, produitId }
export default function ProducerProfile({
  producteur,
  currentUser,
  onBack,
  onContactVendor,
  onNavigateToLogin,
  onNavigateToProduct,
  onSignaler, // () => void — ouvre la modale de signalement partagée
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile(768);
  const [activeTab, setActiveTab] = useState('produits');
  const [produits, setProduits] = useState([]);
  const [certifie, setCertifie] = useState(false);
  const [avisLaisses, setAvisLaisses] = useState([]);
  const [chargementAvisLaisses, setChargementAvisLaisses] = useState(false);
  const [avisLaissesCharges, setAvisLaissesCharges] = useState(false);
  const [note, setNote] = useState(0);
  const [hoverNote, setHoverNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const [avisList, setAvisList] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [chargeErreur, setChargeErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [confirmDeleteAvis, setConfirmDeleteAvis] = useState(null); // avisId | null

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
      const produitsBruts = await produitApi.getProduitsParProducteur(producteur.id);
      const produitsMappes = (produitsBruts || []).map(mapProduitPourVitrine);
      setProduits(produitsMappes);
      // On associe chaque avis au produit déjà chargé pour pouvoir afficher
      // son contexte (nom, lien) sans requête supplémentaire.
      const avisParProduit = await Promise.all(
        (produitsBruts || []).map((p, idx) =>
          avisApi.getAvisParProduit(p.id)
            .then((avis) => (avis || []).map((a) => ({ ...a, produit: produitsMappes[idx] })))
            .catch(() => [])
        )
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

  useEffect(() => {
    if (!producteur?.id) return;
    certificationApi.estCertifieActif(producteur.id)
      .then((actif) => setCertifie(!!actif))
      .catch(() => setCertifie(false));
  }, [producteur?.id]);

  const chargerAvisLaisses = useCallback(async () => {
    if (!producteur?.id || avisLaissesCharges) return;
    setChargementAvisLaisses(true);
    try {
      const avisBruts = await avisApi.getAvisParClient(producteur.id);
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
      setAvisLaisses(enrichis);
      setAvisLaissesCharges(true);
    } catch {
      setAvisLaisses([]);
    } finally {
      setChargementAvisLaisses(false);
    }
  }, [producteur?.id, avisLaissesCharges]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'avis-laisses') chargerAvisLaisses();
  };

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
    if (note === 0) { setError(t('producerProfile.selectRating')); return; }
    if (!commentaire.trim()) { setError(t('producerProfile.commentRequired')); return; }
    if (!producteur.produitId) {
      setError(t('producerProfile.cannotDetermineProduct'));
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
      setError(e?.message || t('producerProfile.publishFailed'));
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const handleDelete = (avisId) => {
    setConfirmDeleteAvis(avisId);
  };

  const handleDeleteConfirmed = async () => {
    const avisId = confirmDeleteAvis;
    setConfirmDeleteAvis(null);
    setEnvoiEnCours(true);
    setError('');
    try {
      await avisApi.supprimerAvis(avisId);
      await chargerAvis();
    } catch (e) {
      setError(e?.message || t('producerProfile.deleteFailed'));
    } finally {
      setEnvoiEnCours(false);
    }
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
          <p>{t('producerProfile.noProducerSelected')}</p>
          <button style={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /> {t('producerProfile.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>

        <ConfirmDialog
          open={!!confirmDeleteAvis}
          title={t('producerProfile.deleteReviewTitle')}
          message={t('producerProfile.deleteReviewMessage')}
          onCancel={() => setConfirmDeleteAvis(null)}
          onConfirm={handleDeleteConfirmed}
        />

        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} /> {t('producerProfile.back')}
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
                {certifie && (
                  <span style={styles.verifiedBadge}><ShieldCheck size={14} /> {t('producerProfile.certifiedBadge')}</span>
                )}
              </div>
              <div style={styles.ratingRow}>
                <StarRow value={moyenne} size={18} />
                <span style={styles.ratingNumber}>{moyenne > 0 ? moyenne.toFixed(1) : '—'}</span>
                <span style={styles.ratingCount}>{t('producerProfile.reviewsCount', { count: totalAvis })}</span>
              </div>
            </div>
          </div>
          {onContactVendor && (
            <button style={styles.contactBtn} onClick={() => onContactVendor({ id: producteur.id, name: producteur.nom })}>
              <MessageCircle size={16} /> {t('producerProfile.contact')}
            </button>
          )}
        </div>

        {/* Signaler ce producteur (même modale que "signaler produit") */}
        <div style={styles.reportRow}>
          <button style={styles.reportLink} onClick={() => onSignaler && onSignaler()}>
            <Flag size={13} /> {t('producerProfile.reportThisProducer')}
          </button>
        </div>

        {chargeErreur && <div style={styles.errorBanner}>{chargeErreur}</div>}

        {/* Onglets */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'produits' ? styles.tabBtnActive : {}) }}
            onClick={() => handleTabClick('produits')}
          >
            <Package size={15} /> {t('producerProfile.productsTab', { count: produits.length })}
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'avis-recus' ? styles.tabBtnActive : {}) }}
            onClick={() => handleTabClick('avis-recus')}
          >
            <Star size={15} /> {t('producerProfile.reviewsReceivedTab', { count: totalAvis })}
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'avis-laisses' ? styles.tabBtnActive : {}) }}
            onClick={() => handleTabClick('avis-laisses')}
          >
            <MessageSquareText size={15} /> {t('producerProfile.reviewsGivenTab')}
          </button>
        </div>

        {activeTab === 'produits' && (
          <div style={styles.listSection}>
            {chargement ? (
              <p style={styles.hint}>{t('producerProfile.loadingProducts')}</p>
            ) : produits.length === 0 ? (
              <p style={styles.emptyText}>{t('producerProfile.noProducts')}</p>
            ) : (
              <div style={styles.produitsGrid}>
                {produits.map((prod) => (
                  <div
                    key={prod.id}
                    style={styles.produitCard}
                    onClick={() => onNavigateToProduct && onNavigateToProduct(prod)}
                  >
                    <div style={styles.produitImageWrap}>
                      <img
                        src={prod.image}
                        alt={prod.name}
                        style={styles.produitImg}
                        onError={(e) => { e.target.src = 'https://picsum.photos/seed/' + prod.id + '/300/300'; }}
                      />
                    </div>
                    <div style={styles.produitInfo}>
                      <h4 style={styles.produitName}>{prod.name}</h4>
                      <span style={styles.produitPrice}>{prod.price.toLocaleString()} FCFA</span>
                      <div style={styles.produitRatingRow}>
                        <StarRow value={prod.rating} size={12} />
                        <span style={styles.produitRatingCount}>({prod.reviews})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'avis-laisses' && (
          <div style={styles.listSection}>
            <h3 style={styles.sectionTitle}>{t('producerProfile.reviewsGivenTitle')}</h3>
            {chargementAvisLaisses ? (
              <p style={styles.hint}>{t('producerProfile.loadingReviews')}</p>
            ) : avisLaisses.length === 0 ? (
              <p style={styles.emptyText}>{t('producerProfile.noReviewsGiven')}</p>
            ) : (
              <div style={styles.avisList}>
                {avisLaisses.map((avis) => (
                  <div key={avis.id} style={styles.avisItem}>
                    <div style={styles.avisAvatar}>{avis.produit?.name?.[0]?.toUpperCase() || 'P'}</div>
                    <div style={styles.avisBody}>
                      <div style={styles.avisTopRow}>
                        <button
                          style={styles.avisProduitLink}
                          onClick={() => avis.produit && onNavigateToProduct && onNavigateToProduct(avis.produit)}
                          disabled={!avis.produit}
                        >
                          {avis.produit?.name || t('producerProfile.productUnavailable')}
                        </button>
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
        )}

        {activeTab === 'avis-recus' && (
        <>
        <div style={{ ...styles.grid, ...(isMobile && { gridTemplateColumns: '1fr' }) }}>

          {/* Répartition des notes */}
          <div style={styles.distribCard}>
            <h3 style={styles.sectionTitle}>{t('producerProfile.ratingDistributionTitle')}</h3>
            {chargement ? (
              <p style={styles.hint}>{t('producerProfile.loadingReviews')}</p>
            ) : totalAvis === 0 ? (
              <p style={styles.emptyText}>{t('producerProfile.noReviewsYet')}</p>
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
                    ? t('producerProfile.vendorCannotReview')
                    : t('producerProfile.loginToReviewProducer')}
                </p>
                {currentUser?.role !== 'vendeur' && (
                  <button style={styles.loginBtn} onClick={onNavigateToLogin}>
                    {t('producerProfile.loginToReviewBtn')}
                  </button>
                )}
              </div>
            ) : monAvis && !editing ? (
              <div>
                <h3 style={styles.sectionTitle}>{t('producerProfile.yourReview')}</h3>
                <div style={styles.myAvisCard}>
                  <StarRow value={monAvis.note} size={16} />
                  <p style={styles.myAvisComment}>{monAvis.commentaire}</p>
                  <div style={styles.myAvisActions}>
                    <button style={styles.editBtn} onClick={() => startEdit(monAvis)} disabled={envoiEnCours}>
                      <Edit3 size={14} /> {t('producerProfile.edit')}
                    </button>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(monAvis.id)} disabled={envoiEnCours}>
                      <Trash2 size={14} /> {t('producerProfile.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ) : !producteur.produitId ? (
              <div style={styles.loginPrompt}>
                <p style={styles.hint}>
                  {t('producerProfile.visitProductFirst')}
                </p>
              </div>
            ) : (
              <div>
                <h3 style={styles.sectionTitle}>
                  {editing ? t('producerProfile.editYourReview') : t('producerProfile.leaveAReview')}
                </h3>
                <div style={styles.starPicker}>
                  <StarRow value={note} size={28} interactive />
                </div>
                <textarea
                  style={styles.textarea}
                  rows="4"
                  placeholder={t('producerProfile.commentPlaceholder')}
                  value={commentaire}
                  onChange={(e) => { setCommentaire(e.target.value); setError(''); }}
                />
                {error && <span style={styles.error}>{error}</span>}
                <div style={styles.formActions}>
                  {editing && (
                    <button style={styles.cancelBtn} onClick={cancelEdit}>{t('producerProfile.cancel')}</button>
                  )}
                  <button style={styles.submitBtn} onClick={handleSubmit} disabled={envoiEnCours}>
                    {envoiEnCours ? t('producerProfile.sending') : editing ? t('producerProfile.update') : t('producerProfile.publishReview')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Liste des avis */}
        <div style={styles.listSection}>
          <h3 style={styles.sectionTitle}>{t('producerProfile.allReviews', { count: totalAvis })}</h3>
          {chargement ? (
            <p style={styles.hint}>{t('producerProfile.loadingReviews')}</p>
          ) : totalAvis === 0 ? (
            <p style={styles.emptyText}>{t('producerProfile.beFirstToReview')}</p>
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
                      <button
                        style={styles.avisProduitLink}
                        onClick={() => avis.produit && onNavigateToProduct && onNavigateToProduct(avis.produit)}
                        disabled={!avis.produit}
                      >
                        {avis.produit?.name || t('producerProfile.productUnavailable')}
                      </button>
                      <StarRow value={avis.note} size={14} />
                      <p style={styles.avisComment}>{avis.commentaire}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        </>
        )}
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

  tabBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#6c757d', cursor: 'pointer' },
  tabBtnActive: { backgroundColor: '#2d6a4f', color: '#ffffff', border: '1px solid #2d6a4f' },

  produitsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' },
  produitCard: { backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' },
  produitImageWrap: { width: '100%', aspectRatio: '1', backgroundColor: '#f1f3f5' },
  produitImg: { width: '100%', height: '100%', objectFit: 'cover' },
  produitInfo: { padding: '12px' },
  produitName: { fontSize: '13.5px', fontWeight: '800', color: '#212529', margin: '0 0 6px 0' },
  produitPrice: { fontSize: '13px', fontWeight: '700', color: '#2d6a4f' },
  produitRatingRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' },
  produitRatingCount: { fontSize: '11px', color: '#adb5bd', fontWeight: '600' },
  avisProduitLink: { background: 'none', border: 'none', padding: 0, fontSize: '13.5px', fontWeight: '800', color: '#2d6a4f', cursor: 'pointer', textAlign: 'left' },

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