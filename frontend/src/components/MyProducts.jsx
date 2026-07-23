
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';
import { traduireNomCategorie } from '../services/productMapping';
import ProductLink from './common/ProductLink';


const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100" style="background:%23e2e8f0;"><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24">🌱</text></svg>';

export default function MyProducts({ products = [], onNavigateToAddProduct, onEditProduct, onDeleteProduct, onDuplicateProduct }) {
  const { t } = useTranslation();
  // Normalise un produit vendeur (les champs peuvent varier selon AddProduct.jsx)
  // afin que l'affichage ne casse jamais, même avec des données minimales.
  const normalize = useCallback((p) => ({
    id: p.id,
    name: p.name || t('myProducts.unnamedProduct'),
    category: p.category || t('myProducts.generalCategory'),
    stock: p.stock ?? 0,
    unit: p.unit || 'kg',
    sales: p.sales ?? 0,
    price: p.price ?? 0,
    status: p.status || 'Actif',
    imageUrl: p.imageUrl || p.image || PLACEHOLDER_IMG,
  }), [t]);

  const normalized = useMemo(() => products.map(normalize), [products, normalize]);
  const [filterTab, setFilterTab] = useState('Tous');
  const [notification, setNotification] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name } | null

  // Handle product deletion
  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name });
  };

  // Handle product duplication
  const handleDuplicate = (product) => {
    onDuplicateProduct && onDuplicateProduct(product);
    showToast(t('myProducts.duplicatedToast', { name: product.name }));
  };

  // Toast notifier helper
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  };

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      tous: normalized.length,
      actifs: normalized.filter(p => p.status === 'Actif').length,
      inactifs: normalized.filter(p => p.status === 'Inactif').length
    };
  }, [normalized]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (filterTab === 'Actifs') return normalized.filter(p => p.status === 'Actif');
    if (filterTab === 'Inactifs') return normalized.filter(p => p.status === 'Inactif');
    return normalized;
  }, [normalized, filterTab]);

  return (
    <div style={styles.container} className="fade-in">
      {/* Toast Notification */}
      {notification && (
        <div style={styles.toast} className="fade-in">
          <span>🔔 {notification}</span>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={t('myProducts.myProducts')}
        message={confirmDelete ? t('myProducts.confirmDelete', { name: confirmDelete.name }) : ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          onDeleteProduct && onDeleteProduct(confirmDelete.id);
          showToast(t('myProducts.deletedToast', { name: confirmDelete.name }));
          setConfirmDelete(null);
        }}
      />

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>{t('myProducts.myProducts')}</h2>
        <button onClick={onNavigateToAddProduct} style={styles.addBtn}>
          <span style={styles.addIcon}>+</span>
          <span>{t('myProducts.addProduct')}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div style={styles.filtersBar}>
        <span style={styles.filterLabel}>{t('myProducts.filter')}</span>
        <div style={styles.tabsContainer}>
          <button 
            onClick={() => setFilterTab('Tous')}
            style={{...styles.tabBtn, ...(filterTab === 'Tous' ? styles.tabBtnActive : {})}}
          >
            {t('myProducts.all')} ({counts.tous})
          </button>
          <button 
            onClick={() => setFilterTab('Actifs')}
            style={{...styles.tabBtn, ...(filterTab === 'Actifs' ? styles.tabBtnActive : {})}}
          >
            {t('myProducts.active')} ({counts.actifs})
          </button>
          <button 
            onClick={() => setFilterTab('Inactifs')}
            style={{...styles.tabBtn, ...(filterTab === 'Inactifs' ? styles.tabBtnActive : {})}}
          >
            {t('myProducts.inactive')} ({counts.inactifs})
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div style={styles.tableCard}>
        {filteredProducts.length > 0 ? (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t('myProducts.image')}</th>
                  <th style={styles.th}>{t('myProducts.product')}</th>
                  <th style={styles.th}>{t('myProducts.category')}</th>
                  <th style={styles.th}>{t('myProducts.stock')}</th>
                  <th style={styles.th}>{t('myProducts.sales')}</th>
                  <th style={styles.th}>{t('myProducts.price')}</th>
                  <th style={styles.th}>{t('myProducts.status')}</th>
                  <th style={styles.th}>{t('myProducts.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} style={styles.tr}>
                    <td style={styles.tdImage}>
                      <div style={styles.imageBox}>
                        <img 
                          src={prod.imageUrl} 
                          alt={prod.name} 
                          style={styles.image}
                          onError={(e) => {
                            e.target.src = PLACEHOLDER_IMG;
                          }}
                        />
                      </div>
                    </td>
                    <td style={styles.tdName}><ProductLink id={prod.id}>{prod.name}</ProductLink></td>
                    <td style={styles.tdCategory}>{traduireNomCategorie(prod.category, t)}</td>
                    <td style={styles.tdStock}>
                      <span style={{
                        ...styles.stockText,
                        ...(prod.stock === 0 ? styles.outOfStockText : {})
                      }}>
                        {prod.stock} {prod.unit}
                      </span>
                    </td>
                    <td style={styles.td}>{prod.sales}</td>
                    <td style={styles.tdPrice}>
                      {prod.price.toLocaleString('fr-FR')} <span style={styles.currency}>FCFA</span>
                    </td>
                    <td style={styles.td}>
                      <span 
                        style={{
                          ...styles.statusIndicator,
                          backgroundColor: prod.status === 'Actif' ? '#2d6a4f' : '#adb5bd',
                          boxShadow: prod.status === 'Actif' ? '0 0 8px rgba(45, 106, 79, 0.4)' : 'none'
                        }}
                        title={prod.status}
                      ></span>
                    </td>
                    <td style={styles.tdActions}>
                      <button 
                        onClick={() => onEditProduct(prod)} 
                        style={styles.actionBtn}
                      >
                        {t('myProducts.edit')}
                      </button>
                      <span style={styles.actionDivider}>|</span>
                      <button 
                        onClick={() => handleDuplicate(prod)} 
                        style={styles.actionBtn}
                      >
                        {t('myProducts.duplicate')}
                      </button>
                      <span style={styles.actionDivider}>|</span>
                      <button 
                        onClick={() => handleDelete(prod.id, prod.name)} 
                        style={{...styles.actionBtn, ...styles.deleteBtn}}
                      >
                        {t('myProducts.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🌾</span>
            <h4>{t('myProducts.noProducts')}</h4>
            <p style={styles.emptyText}>
              {t('myProducts.noProductsDesc')}
            </p>
            <button onClick={onNavigateToAddProduct} style={styles.createBtn}>
              {t('myProducts.createFirst')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
    width: '100%',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    padding: '14px 20px',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    zIndex: 999,
    fontSize: '13px',
    fontWeight: '700',
    animation: 'slideInRight 0.3s ease-out forwards',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
    borderBottom: '1px solid #e9ecef',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#212529',
    letterSpacing: '-0.02em',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '12px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    transition: 'all 0.2s',
    boxShadow: '0 4px 10px rgba(27,77,62,0.15)',
    border: 'none',
    cursor: 'pointer',
  },
  addIcon: {
    fontSize: '16px',
    fontWeight: '800',
  },
  // Filters Bar
  filtersBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#6c757d',
  },
  tabsContainer: {
    display: 'flex',
    backgroundColor: '#ffffff',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #e9ecef',
    gap: '2px',
  },
  tabBtn: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#6c757d',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(27,77,62,0.1)',
  },
  // Table Card
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
    overflow: 'hidden',
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#495057',
    padding: '16px 20px',
    borderBottom: '2px solid #e9ecef',
    backgroundColor: '#f8f9fa',
  },
  tr: {
    borderBottom: '1px solid #e9ecef',
    transition: 'background 0.2s',
  },
  td: {
    fontSize: '13px',
    color: '#495057',
    padding: '16px 20px',
    fontWeight: '500',
  },
  tdImage: {
    padding: '12px 20px',
  },
  imageBox: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f1f3f5',
    border: '1px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  tdName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#212529',
    padding: '16px 20px',
  },
  tdCategory: {
    fontSize: '13px',
    color: '#6c757d',
    padding: '16px 20px',
    fontWeight: '600',
  },
  tdStock: {
    padding: '16px 20px',
  },
  stockText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#2d6a4f',
    backgroundColor: '#e8f5e9',
    padding: '3px 8px',
    borderRadius: '5px',
    display: 'inline-block',
  },
  outOfStockText: {
    color: '#dc3545',
    backgroundColor: '#ffebee',
  },
  tdPrice: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#e07a5f',
    padding: '16px 20px',
  },
  currency: {
    fontSize: '11px',
    fontWeight: '700',
  },
  statusIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'block',
  },
  tdActions: {
    padding: '16px 20px',
    whiteSpace: 'nowrap',
  },
  actionBtn: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1b4d3e',
    backgroundColor: 'transparent',
    border: 'none',
    transition: 'color 0.2s',
    cursor: 'pointer',
  },
  deleteBtn: {
    color: '#dc3545',
  },
  actionDivider: {
    color: '#dee2e6',
    margin: '0 8px',
    fontSize: '12px',
  },
  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6c757d',
    marginBottom: '24px',
    maxWidth: '380px',
    lineHeight: '1.5',
  },
  createBtn: {
    padding: '12px 24px',
    borderRadius: '10px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    transition: 'all 0.2s',
    border: 'none',
    cursor: 'pointer',
  }
};