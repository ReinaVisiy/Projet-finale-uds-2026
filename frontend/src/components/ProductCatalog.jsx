// src/components/ProductCatalog.jsx
import { useState, useMemo } from 'react';
import { Search, ShoppingBag, Star, ArrowLeft } from 'lucide-react';
import useProduits from '../hooks/useProduits';
import { correspondRecherche } from '../utils/produceSearch';
import { traduireNomCategorie } from '../services/productMapping';
import { useTranslation } from 'react-i18next';
import CertifiedBadge from './CertifiedBadge';


export default function ProductCatalog({
  onBack,
  onNavigateToProduct,
  onAddToCart,
}) {
  const { t } = useTranslation();
  const { produits, categories, chargement, erreur } = useProduits();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState(null);

  const applyFilters = (query, categoryId) => {
    let filtered = produits;

    if (categoryId !== 'all') {
      filtered = filtered.filter(p => p.categoryId === categoryId);
    }

    if (query.trim() !== '') {
      // correspondRecherche() reconnaît aussi les équivalents FR/EN d'un
      // même produit, donc la recherche fonctionne pareil dans les 2 langues.
      filtered = filtered.filter(p => {
        if (correspondRecherche(p.name, query)) return true;
        if (correspondRecherche(p.farm, query)) return true;
        if (correspondRecherche(p.category, query)) return true;
        return false;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    applyFilters(value, activeCategory);
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    applyFilters(searchQuery, catId);
  };

  const handleReset = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setFilteredProducts(null);
  };

  const displayedProducts = filteredProducts !== null ? filteredProducts : produits;

  const counts = useMemo(() => {
    const parCategorie = { all: produits.length };
    categories.forEach(cat => {
      parCategorie[cat.id] = produits.filter(p => p.categoryId === cat.id).length;
    });
    return parCategorie;
  }, [produits, categories]);

  if (chargement) {
    return (
      <div style={styles.container}>
        <p style={styles.subtitle}>{t('productCatalog.loading')}</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>{t('productCatalog.loadError', { error: erreur })}</p>
          <button style={styles.emptyBtn} onClick={onBack}>{t('productCatalog.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={20} /> {t('productCatalog.back')}
        </button>
        <h1 style={styles.title}>{t('productCatalog.title')}</h1>
        <p style={styles.subtitle}>{t('productCatalog.subtitle', { count: produits.length })}</p>
      </div>

      <div style={styles.searchWrapper}>
        <div style={styles.searchContainer}>
          <Search size={20} color="#6c757d" />
          <input
            type="text"
            placeholder={t('productCatalog.searchPlaceholder')}
            style={styles.searchInput}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <button style={styles.resetBtn} onClick={handleReset}>{t('productCatalog.reset')}</button>
      </div>

      <div style={styles.categoryFilters}>
        <button
          style={{
            ...styles.categoryFilterBtn,
            ...(activeCategory === 'all' ? styles.categoryFilterActive : {}),
          }}
          onClick={() => handleCategoryClick('all')}
        >
          {t('productCatalog.all')} ({counts.all})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            style={{
              ...styles.categoryFilterBtn,
              ...(activeCategory === cat.id ? styles.categoryFilterActive : {}),
            }}
            onClick={() => handleCategoryClick(cat.id)}
          >
            {traduireNomCategorie(cat.name, t)} ({counts[cat.id] || 0})
          </button>
        ))}
      </div>

      {displayedProducts.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>{t('productCatalog.noResults')}</p>
          <button style={styles.emptyBtn} onClick={handleReset}>{t('productCatalog.seeAll')}</button>
        </div>
      ) : (
        <div style={styles.productGrid}>
          {displayedProducts.map(prod => (
            <div key={prod.id} style={styles.productCard} onClick={() => onNavigateToProduct(prod)}>
              <div style={styles.productImageWrap}>
                <img src={prod.image} alt={prod.name} style={styles.productImg} onError={(e) => { e.target.src = 'https://picsum.photos/seed/' + prod.id + '/300/300'; }} />
                <span style={styles.catBadge}>{traduireNomCategorie(prod.category, t)}</span>
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
                <div style={styles.prodFooter}>
                  <div style={styles.stars}>
                    {[1,2,3,4,5].map(i => {
                      // Reflète la vraie note moyenne (0 étoile remplie si le
                      // produit n'a encore aucun avis), au lieu de 5 étoiles
                      // factices toujours pleines.
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
                    backgroundColor: prod.stock ? '#e9f5ee' : '#fdf1ed',
                  }}>
                    {prod.stock ? t('productCatalog.inStock') : t('productCatalog.lowStock')}
                  </span>
                </div>
                <button
                  style={styles.addToCartBtn}
                  onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(prod); }}
                >
                  <ShoppingBag size={14} /> {t('productCatalog.addToCart')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 20px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: { marginBottom: '30px' },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f1f3f5',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  title: { fontSize: '28px', fontWeight: '900', color: '#212529', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6c757d', margin: '4px 0 0 0' },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  searchContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #dee2e6',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: '#212529',
    backgroundColor: 'transparent',
  },
  resetBtn: {
    padding: '10px 16px',
    backgroundColor: '#f1f3f5',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#6c757d',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  categoryFilters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  categoryFilterBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1.5px solid #dee2e6',
    backgroundColor: '#ffffff',
    color: '#6c757d',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  categoryFilterActive: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f',
    color: '#ffffff',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6c757d',
  },
  emptyText: { fontSize: '16px', marginBottom: '16px' },
  emptyBtn: {
    padding: '10px 20px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #e9ecef',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
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
  productInfo: { padding: '16px' },
  prodHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
  },
  prodName: { fontSize: '16px', fontWeight: '700', color: '#212529', margin: 0 },
  prodPrice: { fontSize: '15px', fontWeight: '800', color: '#e07a5f' },
  prodFarmRow: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '0 0 10px 0' },
  prodFarm: { fontSize: '13px', color: '#6c757d', margin: 0 },
  prodFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10px',
    borderTop: '1px dashed #dee2e6',
    marginBottom: '12px',
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
    transition: 'background 0.2s',
  },
};
