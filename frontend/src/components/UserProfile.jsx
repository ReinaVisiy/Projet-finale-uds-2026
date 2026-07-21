// src/components/UserProfile.jsx
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star, ShieldCheck, Package, Settings, Lock, Mail, Phone, User } from 'lucide-react';
import { produitApi, avisApi, certificationApi } from '../services/api';
import { mapProduitPourVitrine } from '../services/productMapping';

// "Mon profil" : reprend la mise en page riche de ProducerProfile/ClientProfile
// (en-tête, onglets produits/avis) mais pour l'utilisateur connecté lui-même,
// avec des actions "Modifier profil" / "Modifier mot de passe" au lieu de
// "Contacter" / "Signaler".
export default function UserProfile({
  currentUser,
  onEditProfile,
  onChangePassword,
  onBack,
  onNavigateToProduct,
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('produits');
  const [produits, setProduits] = useState([]);
  const [certifie, setCertifie] = useState(false);
  const [avisRecus, setAvisRecus] = useState([]);
  const [avisLaisses, setAvisLaisses] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [chargeErreur, setChargeErreur] = useState(null);

  const estVendeur = currentUser?.role === 'vendeur';
  const estClient = currentUser?.role === 'client';

  // Vendeur : ses produits + les avis reçus sur chacun (avec contexte produit).
  const chargerDonneesVendeur = useCallback(async () => {
    if (!currentUser?.id) { setChargement(false); return; }
    setChargement(true);
    setChargeErreur(null);
    try {
      const produitsBruts = await produitApi.getProduitsParProducteur(currentUser.id);
      const produitsMappes = (produitsBruts || []).map(mapProduitPourVitrine);
      setProduits(produitsMappes);
      const avisParProduit = await Promise.all(
        (produitsBruts || []).map((p, idx) =>
          avisApi.getAvisParProduit(p.id)
            .then((avis) => (avis || []).map((a) => ({ ...a, produit: produitsMappes[idx] })))
            .catch(() => [])
        )
      );
      setAvisRecus(avisParProduit.flat());
    } catch (e) {
      setChargeErreur(e?.message || t('producerProfile.loadingReviews'));
    } finally {
      setChargement(false);
    }
  }, [currentUser?.id, t]);

  // Client : les avis qu'il a lui-même laissés, avec le produit concerné.
  const chargerAvisLaisses = useCallback(async () => {
    if (!currentUser?.id) { setChargement(false); return; }
    setChargement(true);
    setChargeErreur(null);
    try {
      const avisBruts = await avisApi.getAvisParClient(currentUser.id);
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
    } catch (e) {
      setChargeErreur(e?.message || t('clientProfile.loadFailed'));
    } finally {
      setChargement(false);
    }
  }, [currentUser?.id, t]);

  useEffect(() => {
    if (estVendeur) chargerDonneesVendeur();
    else if (estClient) chargerAvisLaisses();
    else setChargement(false);
  }, [estVendeur, estClient, chargerDonneesVendeur, chargerAvisLaisses]);

  useEffect(() => {
    if (!estVendeur || !currentUser?.id) return;
    certificationApi.estCertifieActif(currentUser.id)
      .then((actif) => setCertifie(!!actif))
      .catch(() => setCertifie(false));
  }, [estVendeur, currentUser?.id]);

  const totalAvisRecus = avisRecus.length;
  const moyenne = totalAvisRecus > 0
    ? (avisRecus.reduce((sum, a) => sum + a.note, 0) / totalAvisRecus)
    : 0;

  const StarRow = ({ value, size = 16 }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= Math.round(value) ? '#f5b041' : 'none'} color={i <= Math.round(value) ? '#f5b041' : '#dee2e6'} />
      ))}
    </div>
  );

  if (!currentUser) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.emptyState}>
          <p>{t('userProfile.mustLogin')}</p>
          <button style={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /> {t('userProfile.back')}</button>
        </div>
      </div>
    );
  }

  const roleTag = estVendeur
    ? t('userProfile.vendorTag')
    : estClient
      ? t('userProfile.clientTag')
      : t('userProfile.adminTag');

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} /> {t('userProfile.back')}
        </button>

        {/* En-tête */}
        <div style={styles.headerCard}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>
              {currentUser.photo ? (
                <img src={currentUser.photo} alt={currentUser.nom} style={styles.avatarImg} />
              ) : (
                currentUser.nom?.[0]?.toUpperCase() || <User size={24} />
              )}
            </div>
            <div>
              <div style={styles.nameRow}>
                <h1 style={styles.name}>{currentUser.prenom ? `${currentUser.prenom} ${currentUser.nom}` : currentUser.nom}</h1>
                {estVendeur && certifie && (
                  <span style={styles.verifiedBadge}><ShieldCheck size={14} /> {t('producerProfile.certifiedBadge')}</span>
                )}
                {!estVendeur && <span style={styles.roleTag}>{roleTag}</span>}
              </div>
              {estVendeur && (
                <div style={styles.ratingRow}>
                  <StarRow value={moyenne} size={18} />
                  <span style={styles.ratingNumber}>{moyenne > 0 ? moyenne.toFixed(1) : '—'}</span>
                  <span style={styles.ratingCount}>{t('producerProfile.reviewsCount', { count: totalAvisRecus })}</span>
                </div>
              )}
              <div style={styles.contactRow}>
                <span style={styles.contactItem}><Mail size={13} /> {currentUser.email}</span>
                <span style={styles.contactItem}><Phone size={13} /> {currentUser.telephone || t('userProfile.notProvided')}</span>
              </div>
            </div>
          </div>
          <div style={styles.actions}>
            <button style={styles.actionBtn} onClick={onEditProfile}>
              <Settings size={15} /> {t('userProfile.editProfile')}
            </button>
            <button style={styles.actionBtnSecondary} onClick={onChangePassword}>
              <Lock size={15} /> {t('userProfile.changePassword')}
            </button>
          </div>
        </div>

        {chargeErreur && <div style={styles.errorBanner}>{chargeErreur}</div>}

        {estVendeur && (
          <>
            {/* Onglets */}
            <div style={styles.tabBar}>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'produits' ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab('produits')}
              >
                <Package size={15} /> {t('producerProfile.productsTab', { count: produits.length })}
              </button>
              <button
                style={{ ...styles.tabBtn, ...(activeTab === 'avis-recus' ? styles.tabBtnActive : {}) }}
                onClick={() => setActiveTab('avis-recus')}
              >
                <Star size={15} /> {t('producerProfile.reviewsReceivedTab', { count: totalAvisRecus })}
              </button>
            </div>

            {activeTab === 'produits' && (
              <div style={styles.listSection}>
                {chargement ? (
                  <p style={styles.hint}>{t('producerProfile.loadingProducts')}</p>
                ) : produits.length === 0 ? (
                  <p style={styles.emptyText}>{t('userProfile.noProducts')}</p>
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

            {activeTab === 'avis-recus' && (
              <div style={styles.listSection}>
                {chargement ? (
                  <p style={styles.hint}>{t('producerProfile.loadingReviews')}</p>
                ) : totalAvisRecus === 0 ? (
                  <p style={styles.emptyText}>{t('userProfile.noReviewsReceived')}</p>
                ) : (
                  <div style={styles.avisList}>
                    {avisRecus
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
            )}
          </>
        )}

        {estClient && (
          <div style={styles.listSection}>
            <h3 style={styles.sectionTitle}>{t('producerProfile.reviewsGivenTab')}</h3>
            {chargement ? (
              <p style={styles.hint}>{t('clientProfile.loadingReviews')}</p>
            ) : avisLaisses.length === 0 ? (
              <p style={styles.emptyText}>{t('userProfile.noReviewsGiven')}</p>
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
                          {avis.produit?.name || t('clientProfile.unavailableProduct')}
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
  nameRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' },
  name: { fontSize: '20px', fontWeight: '900', color: '#1b4d3e', margin: 0 },
  verifiedBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: '#2d6a4f', backgroundColor: '#e9f5ee', padding: '3px 10px', borderRadius: '20px' },
  roleTag: { fontSize: '11px', fontWeight: '800', color: '#495057', backgroundColor: '#f1f3f5', padding: '3px 10px', borderRadius: '20px' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  ratingNumber: { fontSize: '14px', fontWeight: '800', color: '#212529' },
  ratingCount: { fontSize: '13px', color: '#6c757d', fontWeight: '600' },
  contactRow: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  contactItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#6c757d', fontWeight: '600' },

  actions: { display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  actionBtnSecondary: { display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', backgroundColor: '#f1f3f5', color: '#212529', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },

  errorBanner: { backgroundColor: '#fdecea', color: '#b3261e', fontSize: '13px', fontWeight: '600', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px' },

  tabBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#6c757d', cursor: 'pointer' },
  tabBtnActive: { backgroundColor: '#2d6a4f', color: '#ffffff', border: '1px solid #2d6a4f' },

  sectionTitle: { fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 16px 0' },
  hint: { fontSize: '13px', color: '#6c757d', fontWeight: '600' },
  emptyText: { fontSize: '13px', color: '#adb5bd', fontWeight: '500' },

  produitsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' },
  produitCard: { backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' },
  produitImageWrap: { width: '100%', aspectRatio: '1', backgroundColor: '#f1f3f5' },
  produitImg: { width: '100%', height: '100%', objectFit: 'cover' },
  produitInfo: { padding: '12px' },
  produitName: { fontSize: '13.5px', fontWeight: '800', color: '#212529', margin: '0 0 6px 0' },
  produitPrice: { fontSize: '13px', fontWeight: '700', color: '#2d6a4f' },
  produitRatingRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' },
  produitRatingCount: { fontSize: '11px', color: '#adb5bd', fontWeight: '600' },

  listSection: { backgroundColor: '#ffffff', borderRadius: '18px', padding: '22px', border: '1px solid #e9ecef' },
  avisList: { display: 'flex', flexDirection: 'column', gap: '18px' },
  avisItem: { display: 'flex', gap: '14px', paddingBottom: '18px', borderBottom: '1px solid #f1f3f5' },
  avisAvatar: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#e9f5ee', color: '#1b4d3e', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avisBody: { flex: 1 },
  avisTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '10px' },
  avisAuthor: { fontSize: '13.5px', fontWeight: '800', color: '#212529' },
  avisDate: { fontSize: '11.5px', color: '#adb5bd', fontWeight: '600', flexShrink: 0 },
  avisProduitLink: { background: 'none', border: 'none', padding: 0, fontSize: '13.5px', fontWeight: '800', color: '#2d6a4f', cursor: 'pointer', textAlign: 'left', display: 'block', marginBottom: '4px' },
  avisComment: { fontSize: '13.5px', color: '#495057', lineHeight: '1.5', margin: '6px 0 0 0' },

  emptyState: { textAlign: 'center', padding: '80px 24px', color: '#adb5bd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
};
