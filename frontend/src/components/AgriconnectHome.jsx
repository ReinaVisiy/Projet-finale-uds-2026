// src/components/AgroMarketHome.jsx
import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Leaf, ShieldCheck, Truck, Star, ArrowRight, UserPlus, PackageSearch, MapPin } from 'lucide-react';
import useProduits from '../hooks/useProduits';
import { useTranslation } from 'react-i18next';
import { correspondRecherche } from '../utils/produceSearch';
import { traduireNomCategorie } from '../services/productMapping';
import { getStatsPubliques as getStatsUtilisateurs } from '../services/api/utilisateurApi';
import { getStatsPubliques as getStatsCertifications } from '../services/api/certificationApi';
import { getStatsPubliques as getStatsCommandes } from '../services/api/commandeApi';
import { getAvisPlateforme, getAvisStatsPlateforme } from '../services/api/avisApi';
import AvisPlateformeListeModal from './AvisPlateformeListeModal';
import CertifiedBadge from './CertifiedBadge';

// Couleurs/images par défaut pour les vignettes de catégorie (le backend ne
// fournit qu'un id + un nom, pas de style visuel). On associe l'image en se
// basant sur le NOM de la catégorie (et non sa position dans la liste) pour
// éviter que l'ordre renvoyé par le backend n'inverse les images (ex :
// élevage affiché avec la photo de légumes).
const STYLE_CATEGORIES_PAR_NOM = {
  agriculture: { image: '/image/marche.jpg', color: '#e9f5ee' },
  agricole: { image: '/image/marche.jpg', color: '#e9f5ee' },
  elevage: { image: '/image/poulet.jpg', color: '#fdf1ed' },
  élevage: { image: '/image/poulet.jpg', color: '#fdf1ed' },
};
// Repli si une catégorie porte un autre nom (nouvelle catégorie ajoutée par un admin).
const STYLE_CATEGORIE_PAR_DEFAUT = { image: '/image/marche.jpg', color: '#e9f5ee' };

function normaliserNomCategorie(nom) {
  return (nom || '').trim().toLowerCase();
}


export default function AgroMarketHome({
  onNavigateToProduct,
  onNavigateToCatalogue,
  onNavigateToLogin,
  onAddToCart,
  currentUser,
}) {
  // La langue est gérée globalement par react-i18next (voir src/i18n) —
  // useTranslation() lit directement l'instance i18next partagée, donc
  // aucune prop `lang` à faire transiter depuis App.jsx.
  const { t } = useTranslation();

  const { produits: allProducts, categories: categoriesBrutes, chargement, erreur } = useProduits();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // Chiffres réels affichés dans la section stats (visiteurs non connectés
  // uniquement) : totalUtilisateurs et producteursVerifies/commandesLivrées
  // viennent chacun d'un microservice différent, on les fusionne ici.
  // null tant que non chargé -> affiché comme "…" (cf. plus bas).
  const [statsReelles, setStatsReelles] = useState({
    totalUtilisateurs: null,
    producteursVerifies: null,
    commandesLivrees: null,
  });

  // Avis plateforme (section "Ce que disent nos utilisateurs") : note
  // moyenne + nombre d'avis pour l'en-tête, et la liste triée (meilleure
  // note d'abord, cf. tri backend) dont on n'affiche que les 3 premiers ici.
  const [avisStatsPlateforme, setAvisStatsPlateforme] = useState({ noteMoyenne: 0, nombreAvis: 0 });
  const [avisPlateforme, setAvisPlateforme] = useState([]);
  const [afficherListeAvis, setAfficherListeAvis] = useState(false);

  useEffect(() => {
    let annule = false;

    Promise.allSettled([
      getStatsUtilisateurs(),
      getStatsCertifications(),
      getStatsCommandes(),
    ]).then(([utilisateurs, certifications, commandes]) => {
      if (annule) return;
      setStatsReelles({
        totalUtilisateurs: utilisateurs.status === 'fulfilled' ? utilisateurs.value?.totalUtilisateurs : null,
        producteursVerifies: certifications.status === 'fulfilled' ? certifications.value?.producteursVerifies : null,
        commandesLivrees: commandes.status === 'fulfilled' ? commandes.value?.commandesLivrees : null,
      });
    });

    return () => { annule = true; };
  }, []);

  // Avis plateforme : chargés une seule fois (visiteurs non connectés
  // uniquement, cf. section témoignages plus bas). La liste est déjà
  // triée meilleure note d'abord côté backend.
  useEffect(() => {
    let annule = false;

    Promise.allSettled([
      getAvisStatsPlateforme(),
      getAvisPlateforme(),
    ]).then(([stats, liste]) => {
      if (annule) return;
      if (stats.status === 'fulfilled') {
        setAvisStatsPlateforme({
          noteMoyenne: stats.value?.noteMoyenne || 0,
          nombreAvis: stats.value?.nombreAvis || 0,
        });
      }
      if (liste.status === 'fulfilled') {
        setAvisPlateforme(liste.value || []);
      }
    });

    return () => { annule = true; };
  }, []);

  const categories = categoriesBrutes.map((c) => {
    const cle = normaliserNomCategorie(c.name);
    const style = STYLE_CATEGORIES_PAR_NOM[cle] || STYLE_CATEGORIE_PAR_DEFAUT;
    return {
      id: c.id,
      name: traduireNomCategorie(c.name, t),
      count: allProducts.filter(p => p.categoryId === c.id).length,
      image: style.image,
      color: style.color,
    };
  });

  // Fonction de filtrage
  const applyFilter = (query) => {
    if (!query.trim()) {
      setFilteredProducts(null);
      return;
    }
    const results = allProducts.filter(p => {
      // Recherche par nom du produit, nom de la ferme ou catégorie —
      // correspondRecherche() reconnaît aussi les équivalents FR/EN
      // (ex. "watermelon" retrouve un produit nommé "pastèque"), donc la
      // recherche fonctionne pareil quelle que soit la langue de l'appli.
      if (correspondRecherche(p.name, query)) return true;
      if (correspondRecherche(p.farm, query)) return true;
      if (correspondRecherche(p.category, query)) return true;
      return false;
    });
    setFilteredProducts(results);
  };

  const handleFilter = () => applyFilter(searchQuery);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleFilter();
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    applyFilter(value);
  };

  const handleCategoryClick = (cat) => {
    if (activeCategory === cat.id) {
      setActiveCategory(null);
      setFilteredProducts(null);
      setSearchQuery('');
    } else {
      setActiveCategory(cat.id);
      const filtered = allProducts.filter(p => p.categoryId === cat.id);
      setFilteredProducts(filtered);
      setSearchQuery('');
      setTimeout(() => document.getElementById('produits')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleReset = () => {
    setFilteredProducts(null);
    setSearchQuery('');
    setActiveCategory(null);
  };

  const previewLimit = 12;
  const displayedProducts = filteredProducts !== null ? filteredProducts : allProducts.slice(0, previewLimit);
  const activeCatName = categories.find(c => c.id === activeCategory)?.name;

  const goToCatalogue = () => onNavigateToCatalogue && onNavigateToCatalogue();

  return (
    <div style={styles.pageWrapper}>
      {/* HERO */}
      <div style={styles.heroSection}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>{t('home.heroTitle')}</h1>
          <p style={styles.heroSubtitle}>{t('home.heroSubtitle')}</p>
          <div style={styles.heroPills}>
            <span style={styles.heroPill}><Leaf size={14} /> {t('home.pill1')}</span>
            <span style={styles.heroPill}><ShieldCheck size={14} /> {t('home.pill2')}</span>
            <span style={styles.heroPill}><Truck size={14} /> {t('home.pill3')}</span>
          </div>
          <button style={styles.heroCta} onClick={goToCatalogue}>
            {t('home.heroCta')} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div style={styles.searchContainer}>
        <div style={styles.searchWrap}>
          <Search size={22} color="#6c757d" style={styles.searchIcon} />
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            style={styles.searchInput}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
          <button style={styles.searchBtn} onClick={handleFilter}>{t('home.filterBtn')}</button>
        </div>
        {filteredProducts !== null && filteredProducts.length === 0 && (
          <div style={styles.noResult}>{t('home.noResult')} &quot;<strong>{searchQuery}</strong>&quot;</div>
        )}
        {filteredProducts !== null && filteredProducts.length > 0 && !activeCategory && (
          <div style={styles.resultInfo}>
            {filteredProducts.length} {t('home.resultCount')} &quot;<strong>{searchQuery}</strong>&quot;
            <button style={styles.resetBtn} onClick={handleReset}>{t('home.reset')}</button>
          </div>
        )}
      </div>

      <div style={styles.container}>
        {/* CATEGORIES : cartes pleines en navigation normale, mais version
            compacte (icône ronde + nom, en ligne) une fois qu'un filtre est
            actif — sinon les grandes cartes poussent les résultats trop bas
            et donnent l'impression qu'il n'y a aucun résultat. */}
        <div style={styles.section} id="categories">
          <h2 style={styles.sectionTitle}>{t('home.catTitle')}</h2>
          <div style={filteredProducts !== null ? styles.categoryGridCompact : styles.categoryGrid}>
            {categories.map(cat => (
              filteredProducts !== null ? (
                <div
                  key={cat.id}
                  style={{
                    ...styles.categoryCardCompact,
                    backgroundColor: cat.color,
                    border: activeCategory === cat.id ? '2px solid #2d6a4f' : '2px solid transparent',
                  }}
                  onClick={() => handleCategoryClick(cat)}
                >
                  <div style={styles.catImgWrapCompact}>
                    <img src={cat.image} alt={cat.name} style={styles.catImg} />
                  </div>
                  <span style={styles.catNameCompact}>{cat.name}</span>
                </div>
              ) : (
                <div
                  key={cat.id}
                  style={{
                    ...styles.categoryCard,
                    backgroundColor: cat.color,
                    border: activeCategory === cat.id ? '2px solid #2d6a4f' : '2px solid transparent',
                    transform: activeCategory === cat.id ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: activeCategory === cat.id ? '0 8px 24px rgba(45,106,79,0.2)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleCategoryClick(cat)}
                >
                  <div style={styles.catImgWrap}>
                    <img src={cat.image} alt={cat.name} style={styles.catImg} />
                  </div>
                  <h3 style={styles.catName}>{cat.name}</h3>
                  <span style={styles.catCount}>{cat.count}</span>
                  {activeCategory === cat.id && (
                    <span style={styles.catActive}>{t('home.catSelected')}</span>
                  )}
                </div>
              )
            ))}
          </div>
        </div>

        {/* PRODUITS */}
        <div style={styles.section} id="produits">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              {activeCategory ? activeCatName : filteredProducts !== null ? t('home.searchResults') : t('home.trendTitle')}
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(activeCategory || filteredProducts !== null) && (
                <button style={styles.resetBtn} onClick={handleReset}>{t('home.showAll')}</button>
              )}
              <button style={styles.resetBtn} onClick={goToCatalogue}>{t('home.voirCatalogue')} →</button>
            </div>
          </div>

          {chargement ? (
            <p style={{ color: '#6c757d' }}>Chargement des produits...</p>
          ) : erreur ? (
            <p style={{ color: '#e07a5f' }}>Impossible de charger les produits : {erreur}</p>
          ) : displayedProducts.length > 0 ? (
            <div style={styles.productGrid}>
              {displayedProducts.map(prod => (
                <div key={prod.id} style={styles.productCard} onClick={() => onNavigateToProduct(prod)}>
                  <div style={styles.productImageWrap}>
                    <img src={prod.image} alt={prod.name} style={styles.productImg} onError={(e) => { e.target.src = 'https://picsum.photos/seed/' + prod.id + '/300/300'; }} />
                    <span style={styles.catBadge}>{prod.category}</span>
                    {!prod.stock && <span style={styles.lowStockBadge}>{t('home.lowStock')}</span>}
                  </div>
                  <div style={styles.productInfo}>
                    <div style={styles.prodHeaderRow}>
                      <h3 style={styles.prodName}>{prod.name}</h3>
                      <span style={styles.prodPrice}>{prod.price.toLocaleString()} FCFA</span>
                    </div>
                    <div style={styles.prodFarmRow}>
                      <p style={styles.prodFarm}>{prod.farm}</p>
                      <CertifiedBadge isCertified={!!prod.certifie} label={t('producerProfile.certifiedBadge')} style={{ marginLeft: '6px' }} />
                    </div>
                    {prod.localisation && (
                      <div style={styles.prodLocationRow}>
                        <MapPin size={12} color="#6c757d" />
                        <span style={styles.prodLocation}>{prod.localisation}</span>
                      </div>
                    )}
                    <div style={styles.prodFooter}>
                      <div style={styles.stars}>
                        {[1,2,3,4,5].map(i => {
                          const note = prod.reviews > 0 ? Math.round(prod.rating || 0) : 0;
                          const rempli = i <= note;
                          return (
                            <Star
                              key={i}
                              size={12}
                              fill={rempli ? '#f5b041' : '#d9d9d9'}
                              color={rempli ? '#f5b041' : '#d9d9d9'}
                            />
                          );
                        })}
                      </div>
                      <span style={{
                        ...styles.stockBadge,
                        color: prod.stock ? '#2d6a4f' : '#e07a5f',
                        backgroundColor: prod.stock ? '#e9f5ee' : '#fdf1ed'
                      }}>
                        {prod.stock ? t('home.inStock') : t('home.lowStock')}
                      </span>
                    </div>
                    <button
                      style={styles.addToCartBtn}
                      onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(prod); }}
                    >
                      <ShoppingBag size={14} /> {t('home.addCart')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <span style={{fontSize: '48px'}}>🔍</span>
              <p>{t('home.emptyMsg')}</p>
              <button style={styles.resetBtn} onClick={handleReset}>{t('home.seeAll')}</button>
            </div>
          )}
        </div>

        {/* COMMENT ÇA MARCHE (uniquement pour les visiteurs non connectés) */}
        {!currentUser && (
          <div style={styles.section} id="comment">
            <h2 style={styles.sectionTitle}>{t('home.howTitle')}</h2>
            <div style={styles.stepsGrid}>
              {[
                { icon: <UserPlus size={28} />, title: t('home.step1'), desc: t('home.step1d') },
                { icon: <PackageSearch size={28} />, title: t('home.step2'), desc: t('home.step2d') },
                { icon: <ShoppingBag size={28} />, title: t('home.step3'), desc: t('home.step3d') },
                { icon: <Truck size={28} />, title: t('home.step4'), desc: t('home.step4d') }
              ].map((step, i) => (
                <div key={i} style={styles.stepCard}>
                  <div style={styles.stepNumber}>{i + 1}</div>
                  <div style={styles.stepIconWrap}>{step.icon}</div>
                  <h4 style={styles.stepTitle}>{step.title}</h4>
                  <p style={styles.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS (uniquement pour les visiteurs non connectés — chiffres réels) */}
        {!currentUser && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t('home.statsTitle')}</h2>
            <div style={styles.statsGrid}>
              {[
                { num: statsReelles.totalUtilisateurs, label: t('home.stat1') },
                { num: statsReelles.producteursVerifies, label: t('home.stat2') },
                { num: allProducts.length, label: t('home.stat3') },
                { num: statsReelles.commandesLivrees, label: t('home.stat4') }
              ].map((stat, i) => (
                <div key={i} style={styles.statCard}>
                  <h3 style={styles.statNum}>{stat.num == null ? '…' : stat.num.toLocaleString()}</h3>
                  <p style={styles.statLabel}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TÉMOIGNAGES (uniquement pour les visiteurs non connectés) */}
        {!currentUser && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t('home.testiTitle')}</h2>

            {/* Note moyenne de la plateforme : étoiles remplies selon la
                note arrondie, pas de note chiffrée à côté (juste les
                étoiles + le nombre d'avis). */}
            <div style={styles.avgRatingRow}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={i <= Math.round(avisStatsPlateforme.noteMoyenne) ? '#f5b041' : 'none'}
                    color="#f5b041"
                  />
                ))}
              </div>
              {avisStatsPlateforme.nombreAvis > 0 && (
                <span style={styles.avgRatingCount}>
                  {t('productDetail.reviewsCount', { count: avisStatsPlateforme.nombreAvis })}
                </span>
              )}
            </div>

            {avisPlateforme.length === 0 ? (
              <p style={styles.testiEmpty}>{t('avisPlateforme.homeEmpty')}</p>
            ) : (
              <div style={styles.testimonialGrid}>
                {avisPlateforme.slice(0, 3).map((testi) => (
                  <div key={testi.id} style={styles.testimonialCard}>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Star key={j} size={14} fill={j <= testi.note ? '#f5b041' : 'none'} color="#f5b041" />
                      ))}
                    </div>
                    <p style={styles.testiText}>{testi.commentaire}</p>
                    <h4 style={styles.testiName}>{testi.clientNom}</h4>
                  </div>
                ))}
              </div>
            )}

            {avisPlateforme.length > 3 && (
              <button type="button" style={styles.voirPlusBtn} onClick={() => setAfficherListeAvis(true)}>
                {t('avisPlateforme.voirPlus')} <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {afficherListeAvis && (
        <AvisPlateformeListeModal onClose={() => setAfficherListeAvis(false)} />
      )}

      {/* PRE-FOOTER (si non connecté) */}
      {!currentUser && (
        <div style={styles.preFooter}>
          <h2 style={styles.preFooterTitle}>{t('home.prefooterTitle')}</h2>
          <button style={styles.preFooterBtn} onClick={onNavigateToLogin}>{t('home.prefooterBtn')}</button>
        </div>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <h2 style={styles.footerBrand}>🌿 Agriconnect</h2>
          <p style={styles.footerTagline}>{t('home.footerTagline')}</p>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>{t('home.navHome')}</a>
            <a href="#" style={styles.footerLink} onClick={(e) => { e.preventDefault(); goToCatalogue(); }}>{t('home.navCatalogue')}</a>
            <a href="#categories" style={styles.footerLink}>{t('home.navCategories')}</a>
            <a href="#comment" style={styles.footerLink}>{t('home.navHow')}</a>
            {!currentUser && <a href="#" style={styles.footerLink} onClick={onNavigateToLogin}>{t('home.navLogin')}</a>}
          </div>
          <div style={styles.footerSocials}>
            <span style={styles.socialText}>{t('home.footerFollow')}</span>
            <div style={styles.socialIcons}>
              <a href="#" style={styles.socialLink}>Facebook</a>
              <a href="#" style={styles.socialLink}>Twitter</a>
              <a href="#" style={styles.socialLink}>Instagram</a>
              <a href="#" style={styles.socialLink}>WhatsApp</a>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p>© 2026 Agriconnect. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// ==================== STYLES =================================
// ============================================================
const styles = {
  pageWrapper: {
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    width: '100%',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  heroSection: {
    position: 'relative',
    minHeight: '520px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: "url('/image/marche.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(27, 77, 62, 0.72)',
    zIndex: 1,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '800px',
    margin: '0 auto',
    padding: '80px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: '900',
    color: '#ffffff',
    margin: '0 0 16px 0',
    letterSpacing: '-0.03em',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: 'rgba(255,255,255,0.92)',
    margin: '0 0 32px 0',
    fontWeight: '500',
  },
  heroPills: {
    display: 'flex',
    gap: '16px',
    marginBottom: '48px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
  },
  heroCta: {
    padding: '16px 36px',
    backgroundColor: '#e07a5f',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 12px 32px rgba(224,122,95,0.4)',
  },
  searchContainer: {
    maxWidth: '1000px',
    margin: '-40px auto 0',
    padding: '0 24px',
    position: 'relative',
    zIndex: 20,
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '12px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef',
  },
  searchIcon: { margin: '0 16px' },
  searchInput: {
    flex: 1,
    border: 'none',
    fontSize: '16px',
    padding: '12px 0',
    outline: 'none',
    color: '#212529',
    fontWeight: '500',
  },
  searchBtn: {
    padding: '14px 28px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  noResult: {
    marginTop: '12px',
    padding: '12px 20px',
    backgroundColor: '#fdf1ed',
    color: '#e07a5f',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
  },
  resultInfo: {
    marginTop: '12px',
    padding: '12px 20px',
    backgroundColor: '#e9f5ee',
    color: '#2d6a4f',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetBtn: {
    background: 'none',
    border: '1px solid #2d6a4f',
    color: '#2d6a4f',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '80px',
  },
  section: {},
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#212529',
    margin: '0',
    letterSpacing: '-0.02em',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
  },
  categoryGridCompact: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  categoryCardCompact: {
    padding: '10px 16px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  catImgWrapCompact: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
  },
  catNameCompact: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#212529',
    margin: 0,
  },
  categoryCard: {
    padding: '24px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
  },
  catImgWrap: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    marginBottom: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
  catImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  catName: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#212529',
    margin: '0 0 6px 0',
  },
  catCount: {
    fontSize: '14px',
    color: '#6c757d',
    fontWeight: '600',
  },
  catActive: {
    marginTop: '10px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#2d6a4f',
    backgroundColor: '#ffffff',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #e9ecef',
    boxShadow: '0 12px 36px rgba(0,0,0,0.04)',
    cursor: 'pointer',
  },
  productImageWrap: {
    height: '200px',
    overflow: 'hidden',
    position: 'relative',
    borderBottom: '1px solid #e9ecef',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  catBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  lowStockBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#e07a5f',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  productInfo: { padding: '20px' },
  prodHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  prodName: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#212529',
    margin: 0,
  },
  prodPrice: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#e07a5f',
  },
  prodFarmRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  prodFarm: {
    fontSize: '13px',
    color: '#6c757d',
    margin: 0,
    fontWeight: '500',
  },
  prodLocationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '12px',
  },
  prodLocation: {
    fontSize: '12px',
    color: '#6c757d',
  },
  prodFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px dashed #dee2e6',
    marginBottom: '14px',
  },
  stars: { display: 'flex', gap: '2px' },
  stockBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  addToCartBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 24px',
    color: '#6c757d',
    fontSize: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  stepCard: {
    backgroundColor: '#ffffff',
    padding: '32px 24px',
    borderRadius: '24px',
    border: '1px solid #e9ecef',
    textAlign: 'center',
    position: 'relative',
    boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
  },
  stepNumber: {
    position: 'absolute',
    top: '-16px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '32px',
    height: '32px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '800',
  },
  stepIconWrap: {
    width: '64px',
    height: '64px',
    backgroundColor: '#e9f5ee',
    color: '#1b4d3e',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '16px auto 20px',
  },
  stepTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#212529',
    margin: '0 0 8px 0',
  },
  stepDesc: {
    fontSize: '14px',
    color: '#6c757d',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  statCard: {
    backgroundColor: '#e9f5ee',
    padding: '32px 24px',
    borderRadius: '24px',
    textAlign: 'center',
    border: '1px solid #b7e4c7',
  },
  statNum: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#1b4d3e',
    margin: '0 0 8px 0',
  },
  statLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#2d6a4f',
    margin: 0,
  },
  testimonialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  avgRatingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  avgRatingCount: {
    fontSize: '14px',
    color: '#6c757d',
    fontWeight: '600',
  },
  testiEmpty: {
    fontSize: '15px',
    color: '#6c757d',
    marginBottom: '24px',
  },
  voirPlusBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '24px',
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: '1.5px solid #2d6a4f',
    borderRadius: '999px',
    color: '#2d6a4f',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  testimonialCard: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '24px',
    border: '1px solid #e9ecef',
    boxShadow: '0 12px 36px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  testiText: {
    fontSize: '15px',
    color: '#495057',
    lineHeight: '1.6',
    fontStyle: 'italic',
    margin: '0 0 20px 0',
  },
  testiName: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#212529',
    margin: 0,
  },
  preFooter: {
    backgroundColor: '#e07a5f',
    padding: '60px 24px',
    textAlign: 'center',
    color: '#ffffff',
  },
  preFooterTitle: {
    fontSize: '24px',
    fontWeight: '800',
    margin: '0 0 32px 0',
  },
  preFooterBtn: {
    padding: '16px 40px',
    backgroundColor: '#ffffff',
    color: '#e07a5f',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  footer: {
    backgroundColor: '#1b4d3e',
    padding: '80px 24px 40px',
    color: 'rgba(255,255,255,0.8)',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '40px',
  },
  footerBrand: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#ffffff',
    margin: 0,
  },
  footerTagline: { fontSize: '16px', margin: 0 },
  footerLinks: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  footerSocials: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  socialText: { fontSize: '14px', fontWeight: '600' },
  socialIcons: { display: 'flex', gap: '20px' },
  socialLink: {
    color: '#b7e4c7',
    textDecoration: 'none',
    fontSize: '14px',
  },
  footerBottom: {
    paddingTop: '40px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    width: '100%',
    fontSize: '13px',
  },
};