import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Share2, Shield, Truck, Package, Plus, Minus, ShoppingCart, MessageCircle, Flag, ChevronRight } from 'lucide-react';
import { getAvisParProduit, getAvisStats, publierAvis } from '../services/api/avisApi';
import { useTranslation } from 'react-i18next';


export default function ProductDetail({ onBack, onAddToCart, onContactVendor, onNavigateToProducerProfile, onSignaler, currentUser, product: propProduct }) {
  const { t } = useTranslation();

  // Avant : un faux "defaultProduct" (Banane Fraîche Premium) était affiché
  // silencieusement si aucun produit n'était transmis (rafraîchissement,
  // lien direct, navigation incohérente). On préfère maintenant afficher
  // un état "produit introuvable" plutôt qu'un produit fictif.
  const product = propProduct || null;
  const [quantity, setQuantity] = useState(1);
  const [isHoveringImg, setIsHoveringImg] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // ===== AVIS (reçus du backend avis-service, plus de valeurs factices) =====
  const [avisList, setAvisList] = useState([]);
  const [avisStats, setAvisStats] = useState({ noteMoyenne: 0, nombreAvis: 0 });
  const [avisLoading, setAvisLoading] = useState(true);
  const [noteChoisie, setNoteChoisie] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const chargerAvis = async () => {
    if (!product?.id) { setAvisLoading(false); return; }
    setAvisLoading(true);
    try {
      const [liste, stats] = await Promise.all([
        getAvisParProduit(product.id),
        getAvisStats(product.id),
      ]);
      setAvisList(liste || []);
      setAvisStats({ noteMoyenne: stats?.noteMoyenne || 0, nombreAvis: stats?.nombreAvis || 0 });
    } catch (err) {
      console.error('Impossible de charger les avis :', err);
    } finally {
      setAvisLoading(false);
    }
  };

  useEffect(() => {
    chargerAvis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const dejaNote = currentUser && avisList.some(a => a.clientId === currentUser.id);

  const handlePublierAvis = async (e) => {
    e.preventDefault();
    if (!currentUser) { alert(t('productDetail.loginToReview')); return; }
    if (!noteChoisie) { alert(t('productDetail.chooseRating')); return; }
    setEnvoiEnCours(true);
    try {
      await publierAvis({ produitId: product.id, note: noteChoisie, commentaire });
      setNoteChoisie(0);
      setCommentaire('');
      await chargerAvis();
    } catch (err) {
      alert(err?.message || t('productDetail.reviewFailed'));
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // Répartition du nombre de partage par plateforme (ouvre un lien de partage standard)
  const partagerSur = (plateforme) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const texte = encodeURIComponent(`${product.name} sur Agriconnect`);
    const urlEncodee = encodeURIComponent(url);
    const liens = {
      whatsapp: `https://wa.me/?text=${texte}%20${urlEncodee}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${urlEncodee}`,
      twitter: `https://twitter.com/intent/tweet?text=${texte}&url=${urlEncodee}`,
    };
    if (plateforme === 'copier') {
      navigator.clipboard?.writeText(url);
      alert(t('productDetail.linkCopied'));
    } else {
      window.open(liens[plateforme], '_blank', 'noopener,noreferrer');
    }
    setShowShareMenu(false);
  };

  const handlePartager = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else {
      setShowShareMenu(true);
    }
  };

  const handleDecrease = () => setQuantity(Math.max(1, quantity - 1));
  const handleIncrease = () => setQuantity(Math.min(product?.stock || 30, quantity + 1));

  // Aucun produit transmis (rafraîchissement, lien direct, navigation
  // incohérente) : on affiche un état "introuvable" plutôt qu'un faux
  // produit par défaut affiché silencieusement.
  if (!product) {
    return (
      <div style={styles.pageWrapper} className="fade-in">
        <div style={{ ...styles.container, textAlign: 'center', padding: '80px 24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#212529', marginBottom: '12px' }}>
            {t('productDetail.notFoundTitle')}
          </h2>
          <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '24px' }}>
            {t('productDetail.notFoundSubtitle')}
          </p>
          <button style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={18} /> {t('productDetail.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  // producteurId vient de produit-service (ProduitResponse.producteurId), propagé
  // par productMapping.mapProduitPourVitrine. C'est le vrai id utilisateur du
  // producteur, nécessaire pour la messagerie et le profil producteur.
  const producteur = {
    id: product.producteurId,
    produitId: product.id,
    nom: product.farm,
    verificationStatus: 'approved',
  };

  return (
    <div style={styles.pageWrapper} className="fade-in">
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <button style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={18} /> {t('productDetail.back')}
          </button>
          <div style={styles.breadcrumbs}>
            <span style={styles.crumbInactive}>{t('productDetail.products')}</span>
            <span style={styles.crumbSeparator}>/</span>
            <span style={styles.crumbInactive}>{product.category}</span>
            <span style={styles.crumbSeparator}>/</span>
            <span style={styles.crumbActive}>{product.name}</span>
          </div>
          <div style={styles.topActions}>
            <div style={{ position: 'relative' }}>
              <button style={styles.actionBtn} onClick={handlePartager}><Share2 size={18} /> {t('productDetail.share')}</button>
              {showShareMenu && (
                <div style={styles.shareMenu} onMouseLeave={() => setShowShareMenu(false)}>
                  <button style={styles.shareMenuItem} onClick={() => partagerSur('whatsapp')}>WhatsApp</button>
                  <button style={styles.shareMenuItem} onClick={() => partagerSur('facebook')}>Facebook</button>
                  <button style={styles.shareMenuItem} onClick={() => partagerSur('twitter')}>X (Twitter)</button>
                  <button style={styles.shareMenuItem} onClick={() => partagerSur('copier')}>{t('productDetail.copyLink')}</button>
                </div>
              )}
            </div>
            <button style={styles.signalBtn} onClick={() => onSignaler && onSignaler(product)}>
              <Flag size={16} /> {t('productDetail.report')}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.container}>
        <div style={styles.mainGrid}>

          {/* Image */}
          <div style={styles.imageColumn}>
            <div
              style={{
                ...styles.mainImageWrapper,
                transform: isHoveringImg ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isHoveringImg ? '0 24px 48px rgba(0,0,0,0.12)' : '0 12px 36px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={() => setIsHoveringImg(true)}
              onMouseLeave={() => setIsHoveringImg(false)}
            >
              <img src={product.image} alt={product.name} style={styles.productImg} />
              <div style={styles.badgeWrap}>
                <span style={styles.organicBadge}>{t('productDetail.organic')}</span>
              </div>
              <div style={styles.catBadgeWrap}>
                <span style={styles.catBadge}>{product.category}</span>
              </div>
            </div>
            <div style={styles.thumbnailsList}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{...styles.thumbnailCard, ...(i === 1 ? styles.thumbnailActive : {})}}>
                  <img src={product.image} alt="" style={styles.thumbImg} />
                </div>
              ))}
            </div>
          </div>

          {/* Détails */}
          <div style={styles.detailsColumn}>
            <div style={styles.productHeader}>
              <h1 style={styles.productTitle}>{product.name}</h1>
              <div style={styles.ratingRow}>
                <div style={styles.stars}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={16} fill={i <= Math.round(avisStats.noteMoyenne) ? "#f5b041" : "none"} color="#f5b041" />
                  ))}
                </div>
                <span style={styles.reviewCount}>{t('productDetail.reviewsCount', { count: avisStats.nombreAvis })}</span>
              </div>
            </div>

            {/* Ferme + bouton Contacter */}
            <div style={styles.farmBanner}>
              <div
                style={styles.farmInfo}
                onClick={() => onNavigateToProducerProfile && onNavigateToProducerProfile(producteur)}
              >
                <div style={styles.farmAvatar}>{(product.farm || 'F')[0]}</div>
                <div>
                  <h3 style={styles.farmName}>{product.farm}</h3>
                  <div style={styles.verifiedWrap}>
                    <Shield size={12} color="#2d6a4f" />
                    <span style={styles.verifiedText}>{t('productDetail.verifiedProducer')}</span>
                  </div>
                  {onNavigateToProducerProfile && (
                    <button
                      style={styles.viewProfileLink}
                      onClick={(e) => { e.stopPropagation(); onNavigateToProducerProfile(producteur); }}
                    >
                      {t('productDetail.viewProfile')} <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
              {/* BOUTON CONTACTER CLIQUABLE */}
              <button
                style={styles.contactBtn}
                onClick={() => onContactVendor && onContactVendor({ id: product.producteurId, name: product.farm, product: product.name })}
              >
                <MessageCircle size={16} />
                {t('productDetail.contact')}
              </button>
            </div>

            <div style={styles.infoStrip}>
              <div style={styles.infoBox}>
                <span style={styles.infoLabel}>{t('productDetail.price')}</span>
                <span style={styles.priceValue}>{product.price.toLocaleString()} FCFA</span>
              </div>
              <div style={styles.infoDivider} />
              <div style={styles.infoBox}>
                <span style={styles.infoLabel}>{t('productDetail.stock')}</span>
                <span style={styles.stockValue}>{t('productDetail.available', { count: product.stock || 30 })}</span>
              </div>
              <div style={styles.infoDivider} />
              <div style={styles.infoBox}>
                <span style={styles.infoLabel}>{t('productDetail.delivery')}</span>
                <div style={styles.deliveryWrap}>
                  <Truck size={16} color="#6c757d" />
                  <span style={styles.deliveryValue}>{t('productDetail.deliveryEstimate')}</span>
                </div>
              </div>
            </div>

            <div style={styles.actionArea}>
              <div style={styles.qtySection}>
                <span style={styles.qtyLabel}>{t('productDetail.quantity')}</span>
                <div style={styles.qtySelector}>
                  <button style={styles.qtyBtn} onClick={handleDecrease}><Minus size={18} /></button>
                  <input style={styles.qtyInput} value={quantity} readOnly />
                  <button style={styles.qtyBtn} onClick={handleIncrease}><Plus size={18} /></button>
                </div>
              </div>
              <button style={styles.addToCartBtn} onClick={() => onAddToCart ? onAddToCart(quantity) : alert(t('productDetail.addedToCart', { count: quantity }))}>
                <ShoppingCart size={20} />
                {t('productDetail.addToCart', { total: (product.price * quantity).toLocaleString() })}
              </button>
            </div>

            <div style={styles.descriptionArea}>
              <h3 style={styles.descTitle}>{t('productDetail.description')}</h3>
              <div style={styles.descContent}>
                {(product.description || [t('productDetail.defaultDesc1'), t('productDetail.defaultDesc2')]).map((line, idx) => (
                  <p key={idx} style={styles.descLine}>
                    {idx > 0 && <span style={styles.bullet}>•</span>}
                    {line}
                  </p>
                ))}
              </div>
              <div style={styles.guaranteeRow}>
                <div style={styles.guaranteeItem}><Package size={18} color="#2d6a4f" /><span>{t('productDetail.securePackaging')}</span></div>
                <div style={styles.guaranteeItem}><Shield size={18} color="#2d6a4f" /><span>{t('productDetail.qualityGuaranteed')}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* AVIS */}
        <div style={styles.reviewsArea}>
          <h3 style={styles.descTitle}>{t('productDetail.customerReviews')}</h3>

          <div style={styles.reviewsSummaryRow}>
            <div style={styles.reviewsSummaryScore}>
              <span style={styles.reviewsSummaryNum}>{avisStats.noteMoyenne.toFixed(1)}</span>
              <div style={styles.stars}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} fill={i <= Math.round(avisStats.noteMoyenne) ? "#f5b041" : "none"} color="#f5b041" />
                ))}
              </div>
              <span style={styles.reviewCount}>{avisStats.nombreAvis} {t('productDetail.reviewsWord')}</span>
            </div>
            <div style={styles.reviewsBars}>
              {[5,4,3,2,1].map(n => {
                const count = avisList.filter(a => a.note === n).length;
                const pct = avisStats.nombreAvis > 0 ? Math.round((count / avisStats.nombreAvis) * 100) : 0;
                return (
                  <div key={n} style={styles.reviewsBarRow}>
                    <span style={styles.reviewsBarLabel}>{n} ★</span>
                    <div style={styles.reviewsBarTrack}><div style={{...styles.reviewsBarFill, width: `${pct}%`}} /></div>
                    <span style={styles.reviewsBarPct}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Laisser un avis */}
          {currentUser ? (
            dejaNote ? (
              <p style={styles.dejaNoteMsg}>{t('productDetail.alreadyReviewed')}</p>
            ) : (
              <form style={styles.reviewForm} onSubmit={handlePublierAvis}>
                <span style={styles.qtyLabel}>{t('productDetail.leaveReview')}</span>
                <div style={styles.stars}>
                  {[1,2,3,4,5].map(i => (
                    <Star
                      key={i}
                      size={22}
                      style={{ cursor: 'pointer' }}
                      fill={i <= noteChoisie ? "#f5b041" : "none"}
                      color="#f5b041"
                      onClick={() => setNoteChoisie(i)}
                    />
                  ))}
                </div>
                <textarea
                  style={styles.reviewTextarea}
                  rows="3"
                  placeholder={t('productDetail.commentPlaceholder')}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                />
                <button type="submit" style={styles.addToCartBtn} disabled={envoiEnCours}>
                  {envoiEnCours ? t('productDetail.sending') : t('productDetail.publish')}
                </button>
              </form>
            )
          ) : (
            <p style={styles.dejaNoteMsg}>{t('productDetail.loginToReviewProduct')}</p>
          )}

          {/* Liste des avis */}
          <div style={styles.reviewsList}>
            {avisLoading ? (
              <p style={{ color: '#6c757d' }}>{t('productDetail.loadingReviews')}</p>
            ) : avisList.length === 0 ? (
              <p style={{ color: '#adb5bd' }}>{t('productDetail.noReviews')}</p>
            ) : (
              avisList.map(a => (
                <div key={a.id} style={styles.reviewCard}>
                  <div style={styles.reviewCardHeader}>
                    <span style={styles.reviewAuthor}>{a.clientNom || t('productDetail.client')}</span>
                    <div style={styles.stars}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={13} fill={i <= a.note ? "#f5b041" : "none"} color="#f5b041" />)}
                    </div>
                    <span style={styles.reviewDate}>{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : ''}</span>
                  </div>
                  {a.commentaire && <p style={styles.reviewComment}>{a.commentaire}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: '#f8f9fa', minHeight: '100vh', width: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  topBar: { backgroundColor: '#ffffff', borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 },
  topBarInner: { maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#212529', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  breadcrumbs: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' },
  crumbInactive: { color: '#adb5bd' },
  crumbSeparator: { color: '#dee2e6' },
  crumbActive: { color: '#212529' },
  topActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#e07a5f', fontSize: '14px', fontWeight: '700', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px' },
  signalBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#fff5f2', color: '#e07a5f', border: '1px solid #f5d4c8', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' },
  imageColumn: { display: 'flex', flexDirection: 'column', gap: '24px' },
  mainImageWrapper: { width: '100%', aspectRatio: '1/1', borderRadius: '32px', overflow: 'hidden', position: 'relative', transition: 'all 0.3s ease' },
  productImg: { width: '100%', height: '100%', objectFit: 'cover' },
  badgeWrap: { position: 'absolute', top: '24px', left: '24px', zIndex: 3 },
  organicBadge: { backgroundColor: '#ffffff', color: '#2d6a4f', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  catBadgeWrap: { position: 'absolute', top: '24px', right: '24px', zIndex: 3 },
  catBadge: { backgroundColor: '#2d6a4f', color: '#ffffff', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '800' },
  thumbnailsList: { display: 'flex', gap: '16px' },
  thumbnailCard: { width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', border: '2px solid transparent', cursor: 'pointer' },
  thumbnailActive: { borderColor: '#2d6a4f' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  detailsColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },
  productHeader: { display: 'flex', flexDirection: 'column', gap: '12px' },
  productTitle: { fontSize: '36px', fontWeight: '800', color: '#212529', margin: 0, lineHeight: '1.2', letterSpacing: '-0.02em' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  stars: { display: 'flex', gap: '4px' },
  reviewCount: { fontSize: '14px', color: '#6c757d', fontWeight: '600' },
  farmBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e9ecef' },
  farmInfo: { display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' },
  farmAvatar: { width: '48px', height: '48px', backgroundColor: '#1b4d3e', color: '#ffffff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' },
  farmName: { fontSize: '16px', fontWeight: '800', color: '#212529', margin: '0 0 4px 0' },
  verifiedWrap: { display: 'flex', alignItems: 'center', gap: '6px' },
  verifiedText: { fontSize: '12px', color: '#2d6a4f', fontWeight: '700' },
  viewProfileLink: { display: 'flex', alignItems: 'center', gap: '2px', background: 'none', border: 'none', color: '#6c757d', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: '4px 0 0 0' },
  contactBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', backgroundColor: '#2d6a4f', color: '#ffffff',
    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(45,106,79,0.3)'
  },
  infoStrip: { display: 'flex', alignItems: 'center', padding: '24px 0', borderTop: '1px solid #e9ecef', borderBottom: '1px solid #e9ecef' },
  infoBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  infoDivider: { width: '1px', height: '40px', backgroundColor: '#e9ecef' },
  infoLabel: { fontSize: '13px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase' },
  priceValue: { fontSize: '28px', fontWeight: '900', color: '#e07a5f' },
  stockValue: { fontSize: '16px', fontWeight: '700', color: '#2d6a4f' },
  deliveryWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  deliveryValue: { fontSize: '16px', fontWeight: '700', color: '#212529' },
  actionArea: { display: 'flex', flexDirection: 'column', gap: '24px' },
  qtySection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  qtyLabel: { fontSize: '14px', fontWeight: '700', color: '#212529' },
  qtySelector: { display: 'flex', alignItems: 'center', width: '160px', backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '12px', overflow: 'hidden' },
  qtyBtn: { width: '48px', height: '48px', background: 'none', border: 'none', color: '#495057', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  qtyInput: { flex: 1, height: '48px', border: 'none', borderLeft: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', textAlign: 'center', fontSize: '16px', fontWeight: '700', color: '#212529', backgroundColor: '#f8f9fa', outline: 'none' },
  addToCartBtn: { width: '100%', padding: '20px', backgroundColor: '#e07a5f', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 8px 24px rgba(224,122,95,0.25)' },
  descriptionArea: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #e9ecef' },
  descTitle: { fontSize: '18px', fontWeight: '800', color: '#212529', margin: '0 0 16px 0' },
  descContent: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' },
  descLine: { fontSize: '15px', color: '#495057', margin: 0, lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '8px' },
  bullet: { color: '#adb5bd', fontSize: '18px' },
  guaranteeRow: { display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '24px', borderTop: '1px dashed #dee2e6' },
  guaranteeItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', color: '#2d6a4f' },
  shareMenu: { position: 'absolute', top: '100%', right: 0, backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', minWidth: '160px', zIndex: 20, overflow: 'hidden' },
  shareMenuItem: { padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#212529', cursor: 'pointer' },
  reviewsArea: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #e9ecef', marginTop: '32px' },
  reviewsSummaryRow: { display: 'flex', gap: '48px', flexWrap: 'wrap', paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid #e9ecef' },
  reviewsSummaryScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '120px' },
  reviewsSummaryNum: { fontSize: '40px', fontWeight: '900', color: '#212529', lineHeight: 1 },
  reviewsBars: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' },
  reviewsBarRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  reviewsBarLabel: { fontSize: '12px', fontWeight: '700', color: '#6c757d', width: '28px' },
  reviewsBarTrack: { flex: 1, height: '8px', backgroundColor: '#f1f3f5', borderRadius: '10px', overflow: 'hidden' },
  reviewsBarFill: { height: '100%', backgroundColor: '#f5b041', borderRadius: '10px' },
  reviewsBarPct: { fontSize: '12px', fontWeight: '700', color: '#adb5bd', width: '20px', textAlign: 'right' },
  reviewForm: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '16px', marginBottom: '24px' },
  reviewTextarea: { border: '1px solid #dee2e6', borderRadius: '12px', padding: '12px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' },
  dejaNoteMsg: { color: '#6c757d', fontSize: '14px', fontWeight: '600', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '12px', marginBottom: '24px' },
  reviewsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  reviewCard: { padding: '16px 0', borderBottom: '1px solid #f1f3f5' },
  reviewCardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' },
  reviewAuthor: { fontSize: '14px', fontWeight: '800', color: '#212529' },
  reviewDate: { fontSize: '12px', color: '#adb5bd' },
  reviewComment: { fontSize: '14px', color: '#495057', margin: 0, lineHeight: 1.5 },
};